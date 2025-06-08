const socket = io('http://192.168.204.131:3069');

socket.on('newData', (data) => {
    document.querySelector(".tdata").innerHTML = data.temp + " °C"
    document.querySelector(".tddata").innerHTML = data.tds
    document.querySelector(".ldata").innerHTML = data.level + "%"
    document.querySelector(".hdata").innerHTML = data.humidity + "%"
    console.log(data.temp)
});

function motor(state) {
    socket.emit('motoron', { state: state });
    if (state == true) {
        document.querySelector(".motoron").innerHTML = `<button class ="button" onclick="motor(0)">MotorOFF</button>`
    } else if (state == false) {
        document.querySelector(".motoron").innerHTML = `<button class ="button"  onclick="motor(1)">MotorON</button>`
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
    socket.emit('manul', { state: state });
    if (state == 1) {
        document.querySelector(".bt").innerHTML = ` <div class="manul"><button class="button" onclick="manual(0)">Auto</button></div>
         <div class="valve"><button class="button" onclick="val(1)">ValveON</button></div>
           <div class="motoron"><button class="button" onclick="motor(1)">MotorON</button></div>`
    } else if (!state) {
        document.querySelector(".bt").innerHTML = ` <div class="manul"><button class="button" onclick="manual(1)">Manual</button></div>`
    }
}