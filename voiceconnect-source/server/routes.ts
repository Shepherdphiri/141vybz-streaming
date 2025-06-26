import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { signalingMessageSchema } from "@shared/schema";

// Store connected users and their WebSocket connections
const connectedUsers = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server on /ws path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let userID: string | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Validate message format
        const validatedMessage = signalingMessageSchema.parse(message);
        
        // Handle user registration
        if (validatedMessage.type === 'register' && validatedMessage.from) {
          userID = validatedMessage.from;
          connectedUsers.set(userID, ws);
          console.log(`User ${userID} connected`);
          return;
        }

        // Set userID from message if not set via registration
        if (!userID && validatedMessage.from) {
          userID = validatedMessage.from;
          connectedUsers.set(userID, ws);
        }

        // Forward message to target user if 'to' field is present
        if (validatedMessage.to) {
          const targetWs = connectedUsers.get(validatedMessage.to);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify(validatedMessage));
            
            // Store call records for certain message types
            if (validatedMessage.type === 'call-request') {
              storage.createCall({
                callerId: validatedMessage.from,
                calleeId: validatedMessage.to,
                duration: 0,
                status: 'initiated'
              });
            } else if (validatedMessage.type === 'call-end') {
              // Update call duration and status when call ends
              // In a real app, you'd track call start time and calculate duration
              storage.updateCallStatus(validatedMessage.from, validatedMessage.to, 'completed');
            }
          } else {
            // Target user not connected, send error back
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Target user not connected',
                targetUser: validatedMessage.to
              }));
            }
          }
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      }
    });

    ws.on('close', () => {
      if (userID) {
        connectedUsers.delete(userID);
        console.log(`User ${userID} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userID) {
        connectedUsers.delete(userID);
      }
    });
  });

  // API endpoint to get recent calls for a user
  app.get('/api/calls/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const calls = await storage.getCallsByUser(userId);
      res.json(calls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  // API endpoint to get connected users count
  app.get('/api/status', (req, res) => {
    res.json({
      connectedUsers: connectedUsers.size,
      serverStatus: 'running'
    });
  });

  return httpServer;
}
