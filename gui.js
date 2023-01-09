var sliderSize = document.getElementById("sizeRange");
var sliderSpeed = document.getElementById("speedRange");
var outputSize = document.getElementById("sizenum");
var outputSpeed = document.getElementById("speednum");
outputSize.innerHTML = sliderSize.value; // Display the default sliderSize value
outputSpeed.innerHTML = sliderSpeed.value;
// Update the current sliderSize value (each time you drag the sliderSize handle)
var lastW, lastH;
sliderSize.oninput = function() {
    sDash = scaleSize;
    scaleSize = this.value;
    state.camX = (state.camX + width * 0.5) * scaleSize / sDash - width * 0.5;
    state.camY = (state.camY + height * 0.5) * scaleSize / sDash - height * 0.5;
    outputSize.innerHTML = this.value;
    worker.postMessage({type: "idle", board: state.board});
}
sliderSpeed.oninput = function() {
    state.speed = this.value;
    outputSpeed.innerHTML = this.value;
}
document.getElementById('mass').onclick = function() {
    let c = document.getElementById('mass').innerText;
    document.getElementById('mass').innerText = c === '6' ? '3' : parseInt(c)+1;
    worker.postMessage({type: "mass", value: c === '6' ? 3 : parseInt(c)+1,});
}
document.getElementById('play').onclick = function() {
    state.pause=!state.pause;
    document.getElementById('play').innerText = state.pause ? "⏵" : "⏸";
}
document.getElementById('clear-board').onclick = clearBoard;
document.getElementById('grid').onclick = function() {
    state.grid =!state.grid; if(state.pause) drawBoard(state);
    document.getElementById('grid').style['opacity'] = state.grid ? "1" : "0.5";
}
document.getElementById('simp').onclick = function() {
    state.highSpeedMode =!state.highSpeedMode; if(state.pause) drawBoard(state);
    document.getElementById('simp').style['opacity'] = state.highSpeedMode ? "1" : "0.5";
}
document.getElementById('life').onclick = function() {
    document.getElementById('life').classList.toggle("selected");
    worker.postMessage({type: "life"});
}
document.getElementById('penA').onclick = function() {
    state.pen = state.pen === A ? 0 : clearToolSelect(A);
    document.getElementById('penA').classList.toggle("selected");
}
document.getElementById('penT').onclick = function() {
    state.pen = state.pen === T ? 0 : clearToolSelect(T);
    document.getElementById('penT').classList.toggle("selected");
}
document.getElementById('penC').onclick = function() {
    state.pen = state.pen === C ? 0 : clearToolSelect(C);
    document.getElementById('penC').classList.toggle("selected");
}
document.getElementById('penG').onclick = function() {
    state.pen = state.pen === G ? 0 : clearToolSelect(G);
    document.getElementById('penG').classList.toggle("selected");
}
document.getElementById('rand').onclick = function() {
    if (state.pause) {
        randomSpawnCells();
    }
}
document.getElementById('drop').onclick = function() {
    randomDrop();
}
document.getElementById('help').onclick = function() {
    document.getElementById('help').classList.toggle("selected");
    document.getElementById('img').classList.toggle("show");
    document.getElementById('helpfile').classList.toggle("show");
}
function clearToolSelect(n) {
    document.getElementById('penA').classList.remove("selected");
    document.getElementById('penT').classList.remove("selected");
    document.getElementById('penC').classList.remove("selected");
    document.getElementById('penG').classList.remove("selected");
    return n;
}

function arrayFilter(list, func) {
    let res = [];
    for (const item of list) {
        if (func(list)) res.push(item);
    }
    return res;
}