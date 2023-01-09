var worker, workerLock = false; initalized = false;

function preload() {
    if (!window.Worker) {
        alert("This browser does not support Worker class, please try to use the newest Chrome");
        return;
    }
    // load any assets (images, sounds, etc.) here
}
var scaleSize = 10,// scale from 5 - 100, meanwhile each cell sized 20 - 400 px
    cellColor, ACTIVE_HEIGHT,
    COLOR_A, COLOR_T, COLOR_C, COLOR_G;

const fr = 60, BOARD_WIDTH = 300, BOARD_HEIGHT = 200;
const LEN_ANIM_CELL_SPAWN = 30, // in frame
      LEN_ANIM_CELL_DIE = 30, PADDING = 2;
const SPAWN = 0, LIVE = 1, DYING = 2, DEAD = 3;
const A = 1, T = 2, C = 3, G = 4;
      
const cellAlpha = 0.5, cellSize = 4, bgColor = "black";

const state = {
    isRendering: false,
    lastboard : null,
    board : null,
    version : "",
    pause : true,
    grid : false,
    camX : 80 * scaleSize * cellSize,
    camY : 80 * scaleSize * cellSize,
    speed : 6, // turns per second
    highSpeedMode : false,
    turn : 0,
    speedCount : 0,
    anims : [],
    pen : 0, // 0: new cell, 1-4: ATCG, 5: drop
};

function setup() {
    // to make code fluent
    worker = new Worker("logic.js");
    worker.onmessage = e => {
        //console.log("Main Thread receive message: ");
        //console.log(e.data);
        //state.lastboard = state.board;
        state.board = e.data.board;
        drawBoard(state);
        if (!initalized) initalized = true;
        //testDraw()
    };
    worker.postMessage({type: "update", version: "init"});
    cellColor = color(240,255,255);
    COLOR_A = color(220,20,60); COLOR_T = color(255,255,0); COLOR_C=color(144,238,144); COLOR_G =color(0,191,255);
    
    frameRate(fr);
    createCanvas(windowWidth, windowHeight);
    ACTIVE_HEIGHT = height - 72;
    background('black')
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    ACTIVE_HEIGHT = height - 72;
    drawBoard(state);
}

// the function here is just a frame counter, actual draw actions are in function drawBoard()
function draw() {
    if (!state.pause && initalized) {
        state.speedCount += deltaTime;
        if (state.speedCount >= (1000 / state.speed)) { // on trigger 
            state.speedCount = 0; // reset counter
            state.turn ++;
            worker.postMessage({
                type: "update",
                board: state.board,
            });
        }
    }
}

function drawGrid() {
    push()
    let c = (157,157,157,80);
    stroke(c);
    noFill();
    let amt = cellSize * scaleSize;
    let [xMin, xMax, yMin, yMax] = getIndexRender();
    for (let i = xMin * amt; i < xMax * amt; i+= amt) {
        line(i, yMin * amt, i, yMax * amt);
    }
    for (let i = yMin * amt; i < yMax * amt; i+= amt) {
        line(xMin * amt, i, xMax * amt, i);
    }
    pop()
}

function randomSpawnCells() {
    let [xMin, xMax, yMin, yMax] = getIndexRender();
    worker.postMessage({
        type: "random",
        board: state.board,
        xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax,
    })
}

function randomDrop() {
    let amt = scaleSize * cellSize;
    let r = min(width, height) / amt * 0.191;
    let x = (width / 2 + state.camX) / amt, y = (height / 2 + state.camY) / amt;
    worker.postMessage({
        type: "drop",
        board: state.board,
        xc: x, yc: y, r: r,
        xMin: Math.ceil(x - r), xMax: Math.floor(x + r),
        yMin: Math.ceil(y - r), yMax: Math.floor(y + r),
    })
}

// handle click to live/die a cell
function handleClickCell(xx, yy) {
    let amt = cellSize * scaleSize;
    let x = Math.floor((xx + state.camX) / amt);
    let y = Math.floor((yy + state.camY) / amt);
    worker.postMessage({
        type: "interact",
        board: state.board,
        new : state.pen,
        x: x,
        y: y,
    });
}

function mouseClicked() {
    if (mouseY > ACTIVE_HEIGHT) return;
    handleClickCell(mouseX, mouseY);
}

// handle drag event, moving camera
let lastX = null, lastY = null;
function mouseDragged(event) {
    if (mouseY > ACTIVE_HEIGHT) return;
    if (!lastX) {
        lastX = mouseX; lastY = mouseY;
    } else {
        state.camX += (lastX - mouseX) * deltaTime / 1000;
        state.camY += (lastY - mouseY) * deltaTime / 1000;
        // border limit
        let pad = PADDING * cellSize * scaleSize;
        let padMaxW =  BOARD_WIDTH * cellSize * scaleSize - width - pad;
        let padMaxH =  BOARD_HEIGHT * cellSize * scaleSize - height - pad;
        if (state.camX < pad) state.camX = pad;
        if (state.camY < pad) state.camY = pad;
        if (state.camX > padMaxW) state.camX = padMaxW;
        if (state.camX > padMaxH) state.camX = padMaxH;
    }
    if (state.pause) drawBoard(state);
}
function mouseReleased(event){
    lastX = null;
    lastY = null;
}


function testDraw() {
    background("black");
    let c = {state:"live"};
    push()
    translate(width / 2, height / 2);
    drawLink([c, null, null, null, null, null, null, c]);
    drawCell(cellSize * scaleSize, cellColor);
    pop()
    /*
    push()
    translate(width / 2 + cellSize * scaleSize, height / 2 + cellSize * scaleSize);
    drawLink([null, null, null, null, null, c, null, null]);
    drawCell(cellSize * scaleSize);
    pop()
    push()
    translate(width / 2, height / 2 - cellSize * scaleSize);
    drawCell(cellSize * scaleSize);
    drawCell(cellSize * scaleSize);
    drawCell(cellSize * scaleSize);
    drawLink([null, null, c, null, null, null, null, null]);
    */
    pop()
}

// rendering part
/**
 * Draw Board base on given param state
 */
function drawBoard(state) {
    translate(-state.camX, -state.camY);
    background(bgColor);
    if (state.grid) drawGrid();
    if (!state.board) return;
    let [xMin, xMax, yMin, yMax] = getIndexRender();
    for (let i = xMin; i < xMax; i++) {
        for (let j = yMin; j < yMax; j++) {
            
            push();
            let size = cellSize * scaleSize;
            let r = size / 2
            let x = i * size, y = j * size;
            let rand1 = random(-scaleSize * 0.5, scaleSize * 0.5);
            let rand2 = random(-scaleSize * 0.5, scaleSize * 0.5)
            translate(x + r + rand1, y + r + rand2);
            /*{ // background
                noStroke();
                fill(bgColor);
                rect(-r, -r, size, size);
            }*/
            if (!state.board[i]) {
                return;
            }
            let cell = state.board[i][j];
            if (cell) {
                if (isLiving(cell)) {
                    drawLink(cell, getNeighbours(state.board, i, j));
                    drawCell(cellSize * scaleSize, getColor(state.board[i][j].type));
                    //drawCurves(getNeighbours(state.board, i, j));
                } else {
                    drawCell(cellSize * scaleSize, color(0,139,139));
                }
            }
            pop();
        }
    }
}

function getIndexRender() {
    let amt = cellSize * scaleSize;
    let xMin = Math.round(max((state.camX - amt) / amt, 0));
    let xMax = Math.round(min((state.camX + width + amt) / amt, BOARD_WIDTH));
    let yMin = Math.round(max((state.camY - amt) / amt, 0));
    let yMax = Math.round(min((state.camY + height + amt) / amt, BOARD_HEIGHT));
    return [xMin, xMax, yMin, yMax];
}

function clearBoard() {
    worker.postMessage({
        type: "clear",
        board: state.board,
    });
}
/**
 * Draw a single cell at 0,0
 */
function drawCell(amt, colorC) {
    let r = (amt) / 2
    let endC = color(colorC.levels[0], colorC.levels[1], colorC.levels[2], 10);
    push()
    if (state.highSpeedMode) {
        fill(colorC);
        circle(0, 0, amt)
    } else {
        noFill();
        strokeWeight(4);
        for (let i = Math.floor(r*2); i >=0; i-= 4) {
            let x = i / (r * 2);
            let c = lerpColor(colorC, endC, x);
            stroke(c);
            circle(0, 0, i);
        }
    }
    pop()
}
/**
 * Draw link between living cells
 * @param {*} neighbours getNeighbours()
 */
function drawLink(cell, neighbours) {
    const amt = cellSize * scaleSize;
    const radius = amt * 0.5
    let lastAngle = 0;
    let dir = [6, 2, 4, 0, 5, 3, 7, 1];
    push()
    if (state.highSpeedMode) {
        noStroke();
        for (let n = 0; n < neighbours.length; n++) {
            if (isLiving(neighbours[n])) { // week
                let base = n % 2 === 0 ? radius : (radius * sqrt(2));
                let w = n % 2 === 0 ? 0.5 : 0.26;
                push()
                fill(127,127,255,125)
                noStroke();
                rotate(lastAngle);
                rect(0, -radius * w, base, radius * w * 2);
                pop()
            }
            lastAngle += QUARTER_PI;
        }
    } else {
        noFill();
        strokeWeight(4);
        for (let n = 0; n < neighbours.length; n++) {
            if (isLiving(neighbours[n])) { // week
                let base = n % 2 === 0 ? radius : (radius * sqrt(2));
                let w = n % 2 === 0 ? 0.5 : 0.2;
                push()
                rotate(lastAngle);
                for (let i = Math.floor(radius); i >= 0; i-=4) {
                    let x = i / radius;
                    let c = lerpColor(color(166, 100, 65, 128), color(0, 0, 0, 0), x);
                    stroke(c);
                    let x1 = base * 0.33, y1 = amt * x * w,
                        x2 = 0, y2 = x * radius,
                        x3 = base, y3 = x * radius * w,
                        x4 = base, y4 = radius * x * w; 
                    curve(x1, y1, x2, y2, x3, y3, x4, y4)
                    curve(x1, -y1, x2, -y2, x3, -y3, x4, -y4)
                }
                pop()
            }
            lastAngle += QUARTER_PI;
        }
    }
    pop();
}

function arrayMap(arr, func) {
    let c = Array.from(arr);
    c.forEach(e=> func(e));
    return c;
}

/**
 * return four neighbours state of given location cell
 * @param {Int} i x-coord
 * @param {Int} j y-coord
 * @returns {List} [→, ↘, ↓, ↙, ←, ↖, ↑, ↗]
 */
 function getNeighbours(board, i, j) {
    let n = [
        i + 1 < BOARD_WIDTH ? board[i+1][j] : null, // right
        i+1 < BOARD_WIDTH && j+1 < BOARD_HEIGHT ? board[i+1][j+1] : null,  // bottom right
        j + 1 < BOARD_HEIGHT ? board[i][j+1] : null, // down
        i  && j+1 < BOARD_HEIGHT ? board[i-1][j+1] : null, // bottom left
        i ? board[i-1][j] : null, // left
        i && j ? board[i-1][j-1] : null, // top left
        j ? board[i][j-1] : null, // up
        i+1 < BOARD_WIDTH && j ? board[i+1][j-1] : null, // top right 
    ];

    return n;
}

function isLiving(cell) {
    return cell ? cell.state === SPAWN || cell.state === LIVE || cell === DYING : false;
}

function getColor(type) {
    switch(type) {
        case A: return COLOR_A;
        case T: return COLOR_T;
        case C: return COLOR_C;
        case G: return COLOR_G;
    }
    return cellColor;
}
/* soft remove
function cornor(l, e, r, angle) {
    const OCT_PI = QUARTER_PI / 2, HEX_PI = QUARTER_PI / 4;
    let d = cellSize * scaleSize * 1.5
    let R = d * 0.5 // radis of curve
    let cx = cellSize * scaleSize, cy = 0;
    push()
    rotate(angle);
    if ((l && e && r) || (l && r)) {
        return;
    } else if (l && e) {
        arc(cx, 0, cx / 2, cx/2, PI, QUARTER_PI - PI);
    } else if (e && r) {
        arc(0, -cx, cx/2, cx/2, QUARTER_PI, HALF_PI);
    } else if (e) {
        //rect(cx-R, cy-R, d, d); line(cx-R, cy-R, cx-R+d, cy-R+d); line(cx-R, cy+d-R, cx+d-R, cy-R); 
        arc(cx, 0, cx / 2, cx/2, PI, QUARTER_PI - PI);
        arc(0, -cx, cx/2, cx/2, QUARTER_PI, HALF_PI);
    } else if (l) {
        line(d/2, 0, d/2, -d/2);
    } else if (r) {
        line(0, -d/2, d/2, -d/2);
    } else { // !l & !e & !r
        arc(0, 0, d, d, -HALF_PI, 0)
    }
    pop();
}
function drawCurves(n) {
    stroke("white");
    noFill();
    let m = arrayMap(n, isLiving);
    let lastAngle = HALF_PI;
    for (let i = 1; i < 8; i += 2) {
        cornor(m[i-1], m[i], m[(i+1)%8], lastAngle);
        lastAngle += HALF_PI;
    }
}*/