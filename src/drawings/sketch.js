let canvasWidth;
let canvasHeight;
let zoom = 1.0;
let panX = 0;
let panY = 0;
let tree;

function setup() {
    
    let canvas = createCanvas(windowWidth , windowHeight);
    canvas.parent('canvas-container');
    canvas.id('theCanvas');
    let root = terminal.gitProcessor.rootCommit;
    let master = terminal.gitProcessor.branches[0];
    tree = new DrawTree(root, master, windowWidth/3, windowHeight/2);

}
  
function draw() {
    background('rgba(255,255,255, 1)');
    scale(zoom);
    translate(panX, panY);
    tree.draw();
    drawCrossAtOrigin();
}

function mouseWheel(event) {
    if (event.target.id === 'theCanvas') {
        zoom += 0.0005 * event.delta;
        return false;
    }
}

function mouseDragged(event) {
    if (event.target.id === 'theCanvas' && !terminal.isHeld) {
        panX += event.movementX;
        panY += event.movementY;
        return false;
    }
}

function windowResized() {
    console.log('resize');
    resizeCanvas(windowWidth , windowHeight);
}
function drawCrossAtOrigin() {
    line(0,0, 100, 0);
    line(0,0, 0, 100);
    line(0,0, -100, 0);
    line(0,0, 0, -100);
}