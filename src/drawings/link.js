class Link {
    constructor( dCommit1, dCommit2 ) {
        this.dCommitRef1 = dCommit1;
        this.dCommitRef2 = dCommit2;
    }

    static compare(link, otherLink) {
        let [linkX1, linkY1] = link.getCommitOneCoordinates();
        let [linkX2, linkY2] = link.getCommitTwoCoordinates();
        let [otherX1, otherY1] = otherLink.getCommitOneCoordinates();
        let [otherX2, otherY2] = otherLink.getCommitTwoCoordinates();
        
        return (linkX1 === otherX1 && linkY1 === otherY1 && 
            linkX2 === otherX2 && linkY2 === otherY2) 
           ||
        (linkX1 === otherX2 && linkY1 === otherY2 && 
            linkX2 === otherX1 && linkY2 === otherY1);
    }
    
    getCommitOneCoordinates() {
        return [this.dCommitRef1.x, this.dCommitRef1.y];
    }
    getCommitTwoCoordinates() {
        return [this.dCommitRef2.x, this.dCommitRef2.y];
    }
    
    draw() {
        let [x1, y1] = this.getCommitOneCoordinates();
        let [x2, y2] = this.getCommitTwoCoordinates();

        push();
        strokeWeight(4);
        line(x1, y1, x2, y2);
        pop();
    }
}