const DIAMETER = 40;

class DrawCommit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isHovered = false;
    }
    onHover(mx, my) {
        let distance = dist(mx,my,this.x,this.y);
        if(distance < DIAMETER / 2) {
            this.isHovered = true;
        } else {
            this.isHovered = false;
        }
    }

    draw() {
        if(this.isHovered) {
            rect(this.x, this.y-115, 200, 100);
        }

        circle(this.x, this.y, DIAMETER);
    }
}