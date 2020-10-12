
let tree;

function setup() {
    let canvas = createCanvas(windowWidth , windowHeight);
    canvas.parent('canvas-container');
    canvas.id('theCanvas');
    let root = terminal.gitProcessor.rootCommit;
    let master = terminal.gitProcessor.branches[0];
    tree = new DrawTree(root, master,windowWidth/2, windowHeight/2);
}
  
function draw() {
    background('rgba(255,255,255, 1)');
    let rect = canvasControl.getRect();
    drawCrossHair();
    push();
    translate(windowWidth/2, windowHeight/2);
    scale(canvasControl.zoom);
    translate(-rect.w/2, -rect.h/2);
    drawGrid();
    tree.draw();
    pop();

    // text(`Width of screen ${windowWidth}, Now with rect ${JSON.stringify(canvasControl.getRect())}`, windowWidth/2, 400);
    canvasControl.update();
}

function mouseWheel(event) {
    if (event.target.id === 'theCanvas') {
        event.delta < 0 ? canvasControl.growTree() : canvasControl.shrinkTree();
        tree.focusDetached = true;
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
    if (event.target.id === 'theCanvas' && !terminal.isHeld && !terminal.isResizing) {
        tree.isFocusDetached = true;
        canvasControl.updatePanCoordinates(event.movementX, event.movementY);

        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth , windowHeight);
}
function drawGrid() {
    let spacedApart = 100;
    let gridWidthSize = 10000 * 10;
    let gridHeightSize = 10000 * 10;
    push();
    stroke(230);
    // Vertical lines
    for(let i = -round(gridWidthSize); i <= round(gridWidthSize); i+=spacedApart) {
        let x = i + canvasControl.panX;
        let y1 = -gridWidthSize  + canvasControl.panY;
        let y2 = gridWidthSize + canvasControl.panY;
        line(x, y1, x, y2);
    }
    // Horizontal lines
    for(let i = -round(gridWidthSize); i <= round(gridWidthSize); i+=spacedApart) {
        let y = i + canvasControl.panY;
        let x1 = -gridWidthSize + canvasControl.panX;
        let x2 = gridWidthSize + canvasControl.panX;
        line(x1, y, x2, y);
    }

    pop();
}

function drawCrossHair() {
    let x = windowWidth/2;
    let y = windowHeight/2;
    let size = 10;
    push();
    stroke(230);
    strokeWeight(2);
    line(x-size, y, x+size, y);
    line(x, y-size, x, y+size);
    pop();
}