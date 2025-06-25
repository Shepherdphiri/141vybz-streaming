const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const listeners = new Set();

wss.on('connection', ws => {
  let isBroadcaster = false;

  ws.on('message', msg => {
    if (typeof msg === 'string' && msg.startsWith('ROLE:')) {
      isBroadcaster = msg === 'ROLE:broadcaster';
      if (!isBroadcaster) listeners.add(ws);
      return;
    }

    if (isBroadcaster) {
      for (const client of listeners) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    }
  });

  ws.on('close', () => {
    listeners.delete(ws);
  });
});

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
