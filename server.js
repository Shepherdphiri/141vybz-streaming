const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/broadcast' });

let clients = [];

wss.on('connection', (ws) => {
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

const streamWSS = new WebSocket.Server({ noServer: true });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/broadcast', (req, res) => {
  res.sendFile(path.join(__dirname, 'broadcast.html'));
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/stream') {
    streamWSS.handleUpgrade(req, socket, head, (ws) => {
      clients.push(ws);
      ws.on('close', () => {
        clients = clients.filter((c) => c !== ws);
      });
    });
  } else {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));