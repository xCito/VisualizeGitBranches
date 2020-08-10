let tree = new DrawTree(200,200);

function setup() {
    let canvas = createCanvas(displayWidth * 0.66 , displayHeight * 0.66);
    canvas.parent('canvas-container');

}
  
function draw() {
    background('rgba(150,150,150, 0.50)');
    tree.draw();
}