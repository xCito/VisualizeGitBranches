let zoom = 1.0;
let panX = 0;
let panY = 0;
let tree;
let commits = [];

function setup() {
    let canvas = createCanvas(windowWidth , windowHeight-300);
    canvas.parent('canvas-container');
    canvas.id('theCanvas');
    let root = terminal.gitProcessor.rootCommit;
    let master = terminal.gitProcessor.branches[0];
    tree = new DrawTree(root, master, 200, 400);

}
  
function draw() {
    background('rgba(100,100,100, 0.9)');
    scale(zoom);
    translate(panX, panY);
    tree.draw();
    drawCrossAtOrigin();
}

function mouseWheel(event) {
    zoom += 0.0005 * event.delta;
    return false;
}

function mouseDragged(event) {
    if (event.target.id === 'theCanvas' && !terminal.isHeld) {
        panX += event.movementX;
        panY += event.movementY;
        return false;
    }
}

function drawCrossAtOrigin() {
    line(0,0, 100, 0);
    line(0,0, 0, 100);
    line(0,0, -100, 0);
    line(0,0, 0, -100);
}