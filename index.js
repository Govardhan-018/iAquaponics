const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow any frontend (or restrict for safety)
  }
});

let sensorData = {};

app.use(cors());
app.use(bodyParser.json());

app.post('/upload', (req, res) => {
    sensorData = req.body;
    console.log("Received from ESP32:", sensorData);

    // Emit to all connected WebSocket clients
    io.emit('newData', sensorData);

    res.send({ status: 'Data received' });
});

app.get('/data', (req, res) => {
    res.send(sensorData);
});

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('newData', sensorData); // send latest data on connect

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
