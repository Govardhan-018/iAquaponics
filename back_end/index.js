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

app.use(cors());
app.use(bodyParser.json());

// === REST Endpoint from ESP32 ===
app.post('/upload', (req, res) => {
  sensorData = req.body;
  console.log("Received from ESP32 (HTTP):", sensorData);
  io.emit('newData', sensorData); // Send to Socket.IO clients
  res.send({ status: 'Data received' });
});

// === Optional Polling Fallback ===
app.get('/data', (req, res) => {
  res.send(sensorData);
});

// === Socket.IO Client (Frontend) ===
io.on('connection', (socket) => {
  console.log('Web client connected via Socket.IO');
  socket.emit('newData', sensorData); // Send current data

  socket.on('ledCommand', (data) => {
    console.log('LED command received from client:', data);
    io.emit('newData', data); // Update web clients
  
    // Also send to ESP32 via raw WebSocket
    const msg = JSON.stringify({ type: 'led', state: data.state });
    espClients.forEach(ws => ws.send(msg));
  });

  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// === Raw WebSocket (ESP32 clients) ===
wss.on('connection', (ws) => {
  console.log('ESP32 connected via raw WebSocket');
  espClients.push(ws);

  // Send latest sensor data immediately
  ws.send(JSON.stringify(sensorData));

  ws.on('close', () => {
    espClients = espClients.filter(c => c !== ws);
    console.log('ESP32 disconnected');
  });

  ws.on('message', (msg) => {
    console.log('Received from ESP32 via WebSocket:', msg);
    // Handle if needed
  });
});

// === Start Server ===
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
