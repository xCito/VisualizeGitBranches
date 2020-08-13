let tree;
function setup() {
    let canvas = createCanvas(windowWidth * 0.66 , windowHeight * 0.66);
    canvas.parent('canvas-container');
    let root = terminal.gitProcessor.rootCommit;
    tree = new DrawTree(root, 200, 400);
}
  
function draw() {
    background('rgba(150,150,150, 0.50)');
    tree.draw();
}