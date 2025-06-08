const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

// === SETUP ===
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});

const wss = new WebSocket.Server({ server, path: '/espws' }); // WebSocket for ESP32 clients

let sensorData = {};
let espClients = [];
let manul;

app.use(cors());
app.use(bodyParser.json());

// === REST Endpoint from ESP32 ===
app.post('/upload', (req, res) => {
  sensorData = req.body;
  console.log("Received from ESP32 (HTTP):", sensorData);
  io.emit('newData', sensorData);
  if (manul == 0) {
    if (sensorData.level < 75) {
      console.log("Auto mode: Turning motor ON");
      espClients.forEach(ws => ws.send(JSON.stringify({ type: 'motor', state: 1 })));
    } else if (sensorData.level > 75) {
      console.log("Auto mode: Turning motor OFF");
      espClients.forEach(ws => ws.send(JSON.stringify({ type: 'motor', state: 0 })));
    }
  }
  res.send({ status: 'Data received' });
});

app.get('/data', (req, res) => {
  res.send(sensorData);
});

io.on('connection', (socket) => {
  console.log('Web client connected via Socket.IO');
  socket.emit('newData', sensorData); // Send current data

  socket.on('manul', (data) => {
    manul = data.state;
    console.log("Manul updated to:", manul);
  });

  socket.on('motoron', (data) => {
    console.log('motor command received from client:', data.state);
    if (manul == 1) {
      espClients.forEach(ws => ws.send(JSON.stringify({ type: 'motor', state: data.state })));
    }
  });

  socket.on('valve', (data) => {
    console.log('valve command received from client:', data.state);
    if (manul == 1) {
      espClients.forEach(ws => ws.send(JSON.stringify({ type: 'valve', state: data.state })));
    }
  });

  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// === Raw WebSocket (ESP32 clients) ===
wss.on('connection', (ws) => {
  console.log('ESP32 connected via raw WebSocket');
  espClients.push(ws);
});

// === Start Server ===
const PORT = 3069;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
