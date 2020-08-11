const DIAMETER = 60;
const RADIUS = DIAMETER / 2;

class DrawCommit {
    constructor(x, y, commit) {
        this.x = x;
        this.y = y;
        this.isHovered = false;
        this.commitRef = commit;
    }
    onHover() {
        let distance = dist(mouseX,mouseY,this.x,this.y);
        if(distance < DIAMETER / 2) {
            this.isHovered = true;
        } else {
            this.isHovered = false;
        }
    }

    draw() {
        this.onHover();
        if(this.isHovered) {
            rect(this.x, this.y-115, 200, 100);
            text(this.commitRef.message, this.x+10, this.y-95);
        }

        circle(this.x, this.y, DIAMETER);
        text(this.commitRef.id, this.x-24, this.y+5);
    }
}