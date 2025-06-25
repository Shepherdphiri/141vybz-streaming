const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

const broadcastWSS = new WebSocket.Server({ noServer: true });
const listenerWSS = new WebSocket.Server({ noServer: true });

let listeners = [];

broadcastWSS.on('connection', (ws) => {
  console.log('🎙️ Broadcaster connected');
  ws.on('message', (data) => {
    listeners.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
  ws.on('close', () => console.log('🎙️ Broadcaster disconnected'));
});

listenerWSS.on('connection', (ws) => {
  console.log('🎧 Listener connected');
  listeners.push(ws);
  ws.on('close', () => {
    listeners = listeners.filter(c => c !== ws);
    console.log('🎧 Listener disconnected');
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/broadcast') {
    broadcastWSS.handleUpgrade(req, socket, head, (ws) => {
      broadcastWSS.emit('connection', ws, req);
    });
  } else if (req.url === '/stream') {
    listenerWSS.handleUpgrade(req, socket, head, (ws) => {
      listenerWSS.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
