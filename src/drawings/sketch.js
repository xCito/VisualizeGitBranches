
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
    drawGrid();
    tree.draw();
}

function mouseWheel(event) {
    if (event.target.id === 'theCanvas') {
        event.delta > 0 ? canvasControl.growTree() : canvasControl.shrinkTree();
        tree.updateTree();
        
        return false;
    }
}

function touchMoved(event) {

    if (event.target.id === 'theCanvas' && !terminal.isHeld) {
        tree.focusDetached = true;
        canvasControl.updatePanCoordinates(mouseX-pmouseX, mouseY-pmouseY);
    
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
function drawGrid() {
    push();
    let spacedApart = canvasControl.zoom * 120;
    stroke(230);
    // Vertical lines
    for(let i = -round(windowWidth * 3); i <= round(windowWidth * 3); i+=spacedApart) {
        let x = i;
        let y1 = -windowHeight * 3;
        let y2 = windowHeight * 3;
        line(x, y1, x, y2);
    }
    // Horizontal lines
    for(let i = -round(windowHeight * 3); i <= round(windowHeight * 3); i+=spacedApart) {
        let y = i;
        let x1 = -windowWidth * 3;
        let x2 = windowWidth * 3;
        line(x1, y, x2, y);
    }

    pop();
}