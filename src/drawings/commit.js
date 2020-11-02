

class DrawCommit {

    constructor(x, y, commit) {
        this.DIAMETER = commit.prev === null ? 20 : 140;
        this.RADIUS = this.DIAMETER / 2;
        this.LERP_SPEED = 0.1;
        this.commitRef = commit;
        this.x = x;
        this.y = y;
        this.destinationX = this.x;
        this.destinationY = this.y;
        this.isHovered = false;
        this.MSG_BOX_WIDTH = 200;
        this.MSG_BOX_HEIGHT = 100;
        this.color = '#a0eba0';
    }
    onHover() {
        let distance = dist(mouseX/canvasControl.zoom, mouseY/canvasControl.zoom, this.getX(), this.getY());
        if(distance < this.RADIUS) {
            this.isHovered = true;
        } else {
            this.isHovered = false;
        }
    }

    getX() {
        return this.x + canvasControl.panX;
    }
    getY() {
        return this.y + canvasControl.panY;
    }
    getDestX() {
        return this.destinationX + canvasControl.panDestX;
    }
    getDestY() {
        return this.destinationY + canvasControl.panDestY;
    }

    setDestination(x = this.x, y = this.y) {
        this.destinationX = x;
        this.destinationY = y;
    }

    move() {
        if(this.x !== this.destinationX) {
            this.x = lerp(this.x, this.destinationX, this.LERP_SPEED);
            this.x = abs(this.x - this.destinationX) < 0.5 ? this.destinationX : this.x;
        }
        if(this.y !== this.destinationY) {
            this.y = lerp(this.y, this.destinationY, this.LERP_SPEED);
            this.y = abs(this.y - this.destinationY) < 0.5 ? this.destinationY : this.y;
        }
    }

    draw() {
        let xCircPos = this.getX();
        let yCircPos = this.getY();
        let xTextPos = xCircPos;
        let yTextPos = yCircPos + 4;
        let sizeOfText = 25;

        this.move();

        // commit message pop up
        this.onHover();
        
        // commit circle
        push();
        fill(this.color);
        if (this.commitRef.isMergeCommit) {
            strokeWeight(10);
        } else {
            strokeWeight(2);
        }
        circle(xCircPos, yCircPos, this.DIAMETER);
        pop();
        
        // commit id
        push();
        if(this.commitRef.prev !== null) {
            fill('#000')
            textAlign(CENTER);
            textSize(sizeOfText);
            text(this.commitRef.id, xTextPos, yTextPos);
        }
        pop();
        
        // push();
        // textSize(17);
        // text(`X: ${this.getX()}\nY: ${this.getY()}`, xCircPos+this.RADIUS+ 10, yCircPos-4);
        // pop();
    }
}