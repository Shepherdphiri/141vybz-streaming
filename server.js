const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const broadcastWSS = new WebSocket.Server({ noServer: true });
const streamWSS = new WebSocket.Server({ noServer: true });

let clients = [];

// Handle broadcaster connection
broadcastWSS.on('connection', (ws) => {
  console.log('Broadcaster connected');
  ws.on('message', (data) => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
  ws.on('close', () => console.log('Broadcaster disconnected'));
});

// Handle listener connection
streamWSS.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter((c) => c !== ws);
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/broadcast', (req, res) => {
  res.sendFile(path.join(__dirname, 'broadcast.html'));
});

app.use(express.static(__dirname));

// Upgrade logic
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/broadcast') {
    broadcastWSS.handleUpgrade(req, socket, head, (ws) => {
      broadcastWSS.emit('connection', ws, req);
    });
  } else if (req.url === '/stream') {
    streamWSS.handleUpgrade(req, socket, head, (ws) => {
      streamWSS.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
