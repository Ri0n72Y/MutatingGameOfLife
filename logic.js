const BOARD_WIDTH = 300, BOARD_HEIGHT = 200;

const SPAWN = 0, LIVE = 1, DYING = 2, DEAD = 3;
const A = 1, T = 2, C = 3, G = 4;
var state = {
    initialized : false,
    working : false,
    mass : 3,
    life : true,
}

function init() {
    // a test shape
    /*
    boardA[1][0] = Cell({state: SPAWN});
    boardA[2][1] = Cell({state: SPAWN});
    boardA[2][2] = Cell({state: SPAWN});
    boardA[1][2] = Cell({state: SPAWN});
    boardA[0][2] = Cell({state: SPAWN});

    boardA[3][4] = Cell({state: SPAWN});
    boardA[3][5] = Cell({state: SPAWN});
    boardA[4][4] = Cell({state: SPAWN});
    boardA[4][5] = Cell({state: SPAWN});

    boardA[7][4] = Cell({state: SPAWN});
    boardA[7][5] = Cell({state: SPAWN});
    boardA[7][6] = Cell({state: SPAWN});
    boardA[6][5] = Cell({state: SPAWN});
    boardA[8][5] = Cell({state: SPAWN});
    boardA[8][4] = Cell({state: SPAWN});
    boardA[0][0] = Cell({state: LIVE, type: A});
    boardA[0][1] = Cell({state: LIVE, type: T});
    boardA[1][0] = Cell({state: LIVE, type: C});
    boardA[1][1] = Cell({state: LIVE, type: G});
    */
    
    state.initialized = true;
}

self.addEventListener('message', (e) => {
    if (!state.initialized) init();
    //console.log("Worker receive message: ");
    //console.log(e.data);
    let data;
    switch (e.data.type) {
        case "mass":
            state.mass = e.data.value;
            return;
        case "life":
            state.life = !state.life;
            return;
        case "idle":
            data = {board: e.data.board};
            break;
        case "update": 
            data = handleUpdate(e.data);
            break;
        case "interact":
            data = handleInteract(e.data);
            break;
        case "clear":
            data = handleClearBoard(e.data);
        case "random":
            data = handleRandomSpawn(e.data, 10);
        case "drop":
            data = handleDrop(e.data, 30);
        default:
    }

    postMessage(data);
});

function handleDrop(data, thres) {
    let b = data.board;
    let xc = data.xc, yc = data.yc;
    for (let i = data.xMin; i <= data.xMax; i++) {
        for (let j = data.yMin; j <= data.yMax; j++) {
            let res = Math.floor(Math.random() * 100)
            if (res < thres && distInt(i, j, xc, yc, data.r)) {
                let type = Math.floor(Math.random() * 4) + 1;
                b[i][j] = Cell({state: SPAWN, type: type});
            }
        }
    }
    return {
        board: b,
    }
}

function handleRandomSpawn(data, thres) {
    let b = data.board;
    let r = 0.2; 
    let xDis = Math.floor((data.xMax - data.xMin) * r), yDis = Math.floor((data.yMax - data.yMin) * r);
    let xMin = data.xMin + xDis, xMax = data.xMax - xDis;
    let yMin = data.yMin + yDis, yMax = data.yMax - yDis;
    for (let i = xMin; i <= xMax; i++) {
        for (let j = yMin; j <= yMax; j++) {
            let res = Math.floor(Math.random() * 100)
            if (res < thres) {
                let type = Math.floor(Math.random() * 4) + 1;
                b[i][j] = Cell({state: SPAWN, type: type});
            }
        }
    }
    return {
        board: b,
    }
}

function handleClearBoard(data) {
    let b = data.board;
    for (let i = 0; i < b.length; i++) {
        b[i] = new Array(BOARD_HEIGHT)
    }
    return {
        board: b,
    }
}

function handleInteract(data) {
    let b = data.board;
    let cell = b[data.x][data.y];
    if (!cell) {
        b[data.x][data.y] = new Cell({state: LIVE, type: data.new})
    } else {
        b[data.x][data.y] = null;
    }
    return {board: b}
}

function handleUpdate(data) {
    let res = {};
    if (data.version === "init") { // initial situation
        let next = new Array(BOARD_WIDTH);;
        for (let i = 0; i < BOARD_WIDTH; i++) {
            next[i] = new Array(BOARD_HEIGHT);
        }
        drawGlider(next, 80, 80);
        res['board'] = next;
    } else {
        let next = new Array(BOARD_WIDTH);;
        for (let i = 0; i < BOARD_WIDTH; i++) {
            next[i] = new Array(BOARD_HEIGHT);
        }
        update(data.board, next);
        res['board'] = next;
    }
    return res;
}

function drawGlider(board, x, y) {
    board[x+1][y+0] = Cell({state: SPAWN});
    board[x+2][y+1] = Cell({state: SPAWN});
    board[x+2][y+2] = Cell({state: SPAWN});
    board[x+1][y+2] = Cell({state: SPAWN});
    board[x+0][y+2] = Cell({state: SPAWN});
}

// logic part
function setCell(board, i, j) {
    board[i][j] = board[i][j] ? 0 : 1;
}
function update(board, next) {
    for (let i = 0; i < BOARD_WIDTH; i++) {
        for (let j = 0; j < BOARD_HEIGHT; j++) {
            linkCell(board, i, j);
        }
    }
    for (let i = 0; i < BOARD_WIDTH; i++) {
        for (let j = 0; j < BOARD_HEIGHT; j++) {
            checkGenUpdate(board, next, i, j);
        }
    }
}

/**
 * Detect next generation state
 * 
 * @param {number} i
 * @param {number} j 
 */
function checkGenUpdate(board, next, i, j) {
    let ns = getNeighber(board, i, j);

    let cell = board[i][j];

    let noise = 0;
    for (let k = 0; k < 8; k++) { // k => ↑↓←→↖↙↗↘
        const n = ns[k];
        noise += isLiving(n) ? 1 : 0;
    }

    if (cell && cell.type === 0) { // exit condition : case for new born cells
        cell.state = LIVE;
        // let type = getType(ns, "random")
        cell.type = Math.floor(Math.random() * 4 + 1) // type % 2 === 0 ? type - 1 : type + 1;
    }

    if (state.life && cell && cell.match && noise <= state.mass) { // exit condition: not over/low populated
        next[i][j] = cell;
        return;
    } else if (noise === 3) {
        next[i][j] = heal(cell);
    } else if (noise === 2) {
        next[i][j] = keep(cell);
        return;
    } else { // exit condition: otherwise
        next[i][j] = null;
        return;
    }
}

function linkCell(board, i, j) {
    let ns = getNeighber(board, i, j);
    let cell = board[i][j];
    if (cell) {
        if (cell.type === 0) return;
        let t = cell.type % 2 === 0 ? cell.type - 1 : cell.type + 1; // type that the cell expect to match with
        let count = 0;
        for (let k = 0; k < 4; k++) { // k => ↑↓←→
            const n = ns[k];
            if (n && n.type === t) count ++;
        }
        cell.match = count > 0;
    }
}
function heal(cell) {
    return isLiving(cell) ? cell : Cell({state: SPAWN, type: 0});
}
function kill(cell) {
    return null;
}
function keep(cell) {
    if (!cell) return cell;
    if (cell.state === DYING) {cell.state=LIVE; return cell;}
    return cell;
}
function getType(ns, type) {
    let pool = [], vote = [];
    for (let i = 0; i < 8; i++) {
        const cell = ns[i];
        if (!cell || cell.type === 0 || !isLiving(cell)) continue;
        vote.push(cell.type);
        if (!pool.includes(cell.type)) {
            pool.push(cell.type);
        }
    }
    if (pool.length === 0) return Math.floor(Math.random() * 4 + 1);
    switch (type) {
        case "random": 
            return pool[Math.floor(Math.random() * pool.length)];
        case "majorVote":
            return findMost(vote);
        default:
            return Math.floor(Math.random() * 4 + 1);
    }
}

/**
 * return four neighbours state of given location cell
 * @param {Int} i x-coord
 * @param {Int} j y-coord
 * @returns {List} [up, down, left, right, lt, ld, rt, rd]
 */
function getNeighber(board, i, j) {
    let n = [
        j                                       ? board[i][j-1] : null, // up
        j + 1 < BOARD_HEIGHT                    ? board[i][j+1] : null, // down
        i                                       ? board[i-1][j] : null, // left
        i + 1 < BOARD_WIDTH                     ? board[i+1][j] : null, // right
        i                 && j                  ? board[i-1][j-1] : null, // top left
        i                 && j+1 < BOARD_HEIGHT ? board[i-1][j+1] : null, // top right
        i+1 < BOARD_WIDTH && j                  ? board[i+1][j-1] : null, // down left 
        i+1 < BOARD_WIDTH && j+1 < BOARD_HEIGHT ? board[i+1][j+1] : null  // down right
    ];

    return n;
}

/**
 * Sum of numbers in the list
 * @param {[Number]} list 
 */
function sum(list) {
    let count = 0;
    for (const i of list) {
        count += i
    }
    return count;
}
function countLive(list) {
    let c = 0;
    for (const i of list) {
        if (isLiving(i)) {
            c ++;
        }
    }
    return c;
}
function findMost(list) {
    let maxCount = [0,0,0,0];
    for (const e of list) {
        maxCount[e - 1] ++;
    }
    let max = 0, maxIndex = [];
    for (let i = 0; i < 4; i++) {
        const e = maxCount[i]
        if (e === max) {
            maxIndex.push()
        } else 
        if (e > max) {
            max = e; maxIndex = [maxCount.indexOf(e)];
        }
    }
    return maxIndex[Math.floor(Math.random() * maxIndex.length)] + 1;
}

/**
 * Cell object record state and cell type
 * @param {*} props.state SPAWN|LIVE|DYING|DEAD 
 * @param {*} props.type  0: normal, 1: A, 2: T, 3: C, 4: G
 */
function Cell(props) {
    return ({
        state : props.state,
        type : props.type ? props.type : 0,
        dir : props.dir,
        match : false,
    });
}

function isLiving(cell) {
    return cell ? cell.state === SPAWN || cell.state === LIVE : false;
}

function distInt(x, y, xc, yc, r) {
    return Math.sqrt((x - xc) * (x - xc) + (y - yc) * (y - yc)) <= r 
}