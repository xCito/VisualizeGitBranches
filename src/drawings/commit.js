

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
        let distance = dist(mouseX - cnvProps.panX, mouseY - cnvProps.panY, this.x, this.y);
        if(distance < this.RADIUS*cnvProps.zoom) {
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
        let msgBoxWidth = 200;
        let msgBoxHeight = 100;

        this.move();
        
        // commit message pop up
        this.onHover();
        if(this.isHovered) {
            push();
            rect(this.x-msgBoxWidth, this.y - (this.RADIUS*cnvProps.zoom) - msgBoxHeight, msgBoxWidth, msgBoxHeight);
            textSize(15);
            text(this.commitRef.message, this.x - msgBoxWidth + 5, this.y - (this.RADIUS*cnvProps.zoom)-msgBoxHeight+5, msgBoxWidth-5, msgBoxHeight-5);
            pop();
        }
        
        // commit circle
        push();
        fill(this.color);
        if (this.commitRef.isMergeCommit) {
            strokeWeight(10);
        } else {
            strokeWeight(2);
        }
        circle(this.x, this.y, this.DIAMETER * cnvProps.zoom);
        pop();
        
        // commit id
        push();
        if(this.commitRef.prev !== null) {
            fill('#000')
            textAlign(CENTER);
            let sizeOfText = 25 * cnvProps.zoom;
            if (sizeOfText > 10) {
                textSize(sizeOfText);
                text(this.commitRef.id, this.x, this.y+4);
            }
        }
        pop();
    }
}