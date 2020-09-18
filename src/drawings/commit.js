

class DrawCommit {

    constructor(x, y, commit) {
        this.DIAMETER = commit.prev === null ? 20 : 140;
        this.RADIUS = this.DIAMETER / 2;
        this.LERP_SPEED = 0.06;
        this.commitRef = commit;
        this.x = x;
        this.y = y;
        this.destinationX = this.x;
        this.destinationY = this.y;
        this.isHovered = false;
        this.color = '#a0eba0';
    }
    onHover() {
        let distance = dist(mouseX - panX, mouseY - panY, this.x, this.y);
        if(distance < this.RADIUS) {
            this.isHovered = true;
        } else {
            this.isHovered = false;
        }
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
        this.move();
        
        // commit message pop up
        this.onHover();
        if(this.isHovered) {
            rect(this.x-200, this.y-this.RADIUS-100, 200, 100);
            text(this.commitRef.message, this.x-200+10, this.y-this.RADIUS-80);
        }
        
        // commit circle
        push();
        fill(this.color);
        if (this.commitRef.isMergeCommit) {
            strokeWeight(10);
        } else {
            strokeWeight(2);
        }
        circle(this.x, this.y, this.DIAMETER);
        pop();
        
        // commit id
        push();
        if(this.commitRef.prev !== null) {
            fill('#000').textSize(25);
            text(this.commitRef.id, this.x-50, this.y+5);
        }
        pop();
    }
}