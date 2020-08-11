let tree;
function setup() {
    let canvas = createCanvas(displayWidth * 0.66 , displayHeight * 0.66);
    canvas.parent('canvas-container');
    let root = terminal.gitProcessor.rootCommit;
    tree = new DrawTree(root);
}
  
function draw() {
    background('rgba(150,150,150, 0.50)');
    tree.draw();
}