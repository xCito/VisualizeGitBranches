
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
    translate(canvasControl.panX, canvasControl.panY);
    tree.draw();
    drawCrossAtOrigin();
}

function mouseWheel(event) {
    if (event.target.id === 'theCanvas') {
        event.delta > 0 ? canvasControl.growTree() : canvasControl.shrinkTree();
        tree.updateTree();
        
        return false;
    }
}

function mouseDragged(event) {
    if (event.target.id === 'theCanvas' && !terminal.isHeld) {
        tree.focusDetached = true;
        canvasControl.updatePanCoordinates(event.movementX, event.movementY);

        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth , windowHeight);
}
function drawCrossAtOrigin() {
    line(0,0, 100, 0);
    line(0,0, 0, 100);
    line(0,0, -100, 0);
    line(0,0, 0, -100);
}