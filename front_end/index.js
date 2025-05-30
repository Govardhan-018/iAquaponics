const socket = io('http://192.168.173.131:3000');

socket.on('newData', (data) => {
  document.getElementById('dataDisplay').textContent = JSON.stringify(data);
});

function toggleLED(state) {
      socket.emit('ledCommand', { state: state });
    }