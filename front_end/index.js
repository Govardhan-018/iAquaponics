const socket = io('http://192.168.173.131:3000');

socket.on('newData', (data) => {
    document.getElementById('dataDisplay').textContent = JSON.stringify(data);
});

function motor(state) {
    socket.emit('motoron', { state: state });
    if (state == true) {
        document.querySelector(".motoron").innerHTML = `<button class ="button" onclick="motor(0)">Turn Motor OFF</button>`
    } else if (state == false) {
        document.querySelector(".motoron").innerHTML = `<button class ="button"  onclick="motor(1)">Turn Motor ON</button>`
    }

}
function val(state) {
    socket.emit('valve', { state: state });
    if (state == true) {
        document.querySelector(".valve").innerHTML = `<button class="button" onclick="val(0)">ValveOFF</button>`
    } else if (state == false) {
        document.querySelector(".valve").innerHTML = `<button class="button" onclick="val(1)">ValveON</button>`
    }

}

function manual(state) {
    if (state) {
        document.querySelector(".bt").innerHTML = ` <div class="manul"><button class="button" onclick="manual(false)">Auto</button></div>
         <div class="valve"><button class="button" onclick="val(1)">ValveON</button></div>
           <div class="motoron"><button class="button" onclick="motor(1)">Motor ON</button></div>`
    } else if (!state) {
        document.querySelector(".bt").innerHTML = ` <div class="manul"><button class="button" onclick="manual(true)">Manual</button></div>`
    }
}