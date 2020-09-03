
class DrawTree {
    constructor(root, mainBranch, baseX, baseY) {
        this.root = root;
        this.branches = [mainBranch];
        this.x = baseX;
        this.y = baseY;
        this.refToDrawCommitMap = new Map();
        this.commitLinkSet = new Set();
        this.COMMIT_HEIGHT_DIST = 100;
        this.COMMIT_WIDTH_DIST = 100;
        this.listOfColor = ['#f7dd94','#ccf794','#94f7b5','#94eff7','#94a0f7','#cf94f7','#f794e8','#f79494'];

        this.availableRows = {
            POS: [ 1 ],
            NEG: [-1 ]
        };
        this.lastRowTaken;
        this.head = mainBranch;
        this.setup();
    }
    
    setup() {
        this.refToDrawCommitMap.set(this.root, new DrawCommit(this.x, this.y, this.root));
        observableCommits.addObserverCallback(this.commitChangeCallback);
        observableBranches.addObserverCallback(this.branchChangeCallback);
    }

    branchChangeCallback = () => {
        let branchState = observableBranches.getState();
        if (branchState.type === 'NEW') {
            this.branches.push(branchState.branch);
        } else if (branchState.type === 'DELETE') {
            this.branches = this.branches.filter( b => b.name !== branchState.branch.name);
        } else if (branchState.type === 'HEAD') {
            this.head = branchState.branch;
        } else if (branchState.type === 'UPDATE') {
            this.updateTree();
        } else {
            console.log('not sure what to do here');
        }
    }

    commitChangeCallback = () => {
        let commitObj = observableCommits.getState();
        this.addCommitToTree(commitObj);    
    }

    addCommitToTree(commitObj) {
        let commitRef = commitObj.commit;
        let prevDCommit = this.refToDrawCommitMap.get(commitRef.prev);
        let [prevX,prevY] = this.getPositionOfCommit(commitRef.prev);
        let newDrawCommit = new DrawCommit(prevX, prevY, commitRef);
        let moveX, moveY;

        // Decide where to put commit
        [moveX, moveY] = this.determinePositionOfCommit(commitRef);
        newDrawCommit.setDestination(moveX, moveY);
        
        // store for reference
        this.refToDrawCommitMap.set( commitRef, newDrawCommit );

        // sets color for commit
        if (moveY !== prevY) {
            newDrawCommit.color = this.listOfColor.shift();
            this.listOfColor.push(newDrawCommit.color);
        } else {
            newDrawCommit.color = prevDCommit.color;
        }

        // get draw commit of prev commit ref.
        this.linkTwoCommits(prevDCommit, newDrawCommit);
    }

    isBranchOffCommit(commitRef) {
        if (commitRef.prev == null) 
            return false;
        
        return commitRef.prev.branchCommits.some( c => c.id === commitRef.id);
    }

    getPositionOfCommit(commitRef) {
        let dCommit = this.refToDrawCommitMap.get(commitRef);
        return [dCommit.destinationX, dCommit.destinationY];
    }

    determinePositionOfCommit(commitRef) {
        let [prevX,prevY] = this.getPositionOfCommit(commitRef.prev);
        let x, y;
        if (this.isBranchOffCommit(commitRef)) {
            let rowNum = this.getNextAvailableRow(commitRef);
            x = prevX + this.COMMIT_WIDTH_DIST;
            y = this.y + (rowNum * this.COMMIT_HEIGHT_DIST);
        } else {
            x = prevX + this.COMMIT_WIDTH_DIST;
            y = prevY + 0;
        }

        return [x,y];
    }

    getNextAvailableRow(branchingCommit) {
        let row;
        let [,prevY] = this.getPositionOfCommit(branchingCommit.prev);
        if(prevY === this.y) {// main commit line (master)
            let nextUpperRow = abs(this.availableRows['NEG'][0]);
            let nextLowerRow = this.availableRows['POS'][0];
            let smaller = nextUpperRow < nextLowerRow ? 'NEG' : 'POS';
            row = this.availableRows[smaller].shift();
        } else if( prevY > this.y ) { // below main commit line
            row = this.availableRows['POS'].shift();
        } else { // above main commit line
            row = this.availableRows['NEG'].shift();
        }
        
        if (this.availableRows['NEG'].length === 0) 
            this.availableRows['NEG'].push( row - 1 );
        if (this.availableRows['POS'].length === 0) 
            this.availableRows['POS'].push( row + 1 );
    
        return row;
    }

    calcRowFromY(yValue) {
        return this.y - yValue;
    }
    freeRowY( row ) {
        this.availableRows.push( row );
        this.availableRows.sort( (a,b) => a - b);
    }

    linkTwoCommits(drawCommit1, drawCommit2) {
        let link = new Link(drawCommit1, drawCommit2);
        this.commitLinkSet.add(link);
    }

    updateTree() {
        const redrawHelper = ( curCommit ) => {
            if(curCommit === null) {
                return;
            }

            let drawCommit;
            let prevDrawCommit = this.refToDrawCommitMap.get(curCommit.prev)
            if(this.refToDrawCommitMap.has(curCommit)) {
                drawCommit = this.refToDrawCommitMap.get(curCommit);
            } else {
                let [prevX, prevY] = this.getPositionOfCommit(curCommit.prev);
                previousY = prevY;
                drawCommit = new DrawCommit(prevX, prevY, curCommit);
                this.refToDrawCommitMap.set(curCommit);
            }
            
            // Set coordinates for current commit
            let [x,y] = !curCommit.prev ? [this.x,this.y] : this.determinePositionOfCommit(curCommit);
            drawCommit.setDestination(x, y);
            
            // Link current commit with its previous commit
            if(prevDrawCommit) {
                this.linkTwoCommits(drawCommit, prevDrawCommit);
                // sets color for commit
                if (drawCommit.destinationY === prevDrawCommit.destinationY) {
                    drawCommit.color = prevDrawCommit.color;
                }
            }
            

            redrawHelper(curCommit.next);
            curCommit.branchCommits.forEach( c => redrawHelper(c));
        };

        this.commitLinkSet.clear();
        this.availableRows = {
            POS: [ 1 ],
            NEG: [-1 ]
        };
        redrawHelper(this.root);
    }

    draw() {
        this.commitLinkSet.forEach( link => {
            link.draw();
        }); 
        this.refToDrawCommitMap.forEach( (drawCommit, commitRef) => {
            drawCommit.draw();
            let offset = 0;
            this.branches.forEach( b => {
                if (b.curCommit === commitRef) { 
                    this.drawArrow(drawCommit.x + offset, drawCommit.y + offset - drawCommit.RADIUS, b === this.head); 
                    offset += 2;
                }
            });
            
        });
    }
    
    drawArrow(x, y, isMain) {
        push();
        (isMain) ? fill(0) : fill(255);
        beginShape();
        vertex(x, y);  
        vertex(x+10, y-15);
        vertex(x+5, y-15);
        vertex(x+5, y-40);
        vertex(x-5, y-40);
        vertex(x-5, y-15);
        vertex(x-10, y-15);
        vertex(x, y);
        endShape();
        pop();
    }
}
// };
// let recursiveDrawHelper = (cur, x, y) => {
//     if (cur == null) {
//         return;
//     }
//     let x1 = x, x2 = x + 100;
//     let y1 = y, y2 = y;

//     // Draw Line from current commit point to next commit ahead
//     if (cur.next != null) {
//         x2 = x + 100;
//         line(x1, y1, x2, y2);
//     }

//     // Draw Branching commits
//     cur.branchCommits.forEach( c => {
//         x2 = x + 50;
//         let row = ((-1)**rowCounter) * Math.ceil(rowCounter / 2);
//         console.log(row);
//         y2 = y2 + (row * 100);
//         rowCounter++;
//         line(x1, y1, x2, y2);
//         recursiveDrawHelper(c, x2, y2);
//     });  
//     recursiveDrawHelper(cur.next, x2, y2);
    
//     let c = new DrawCommit(x1, y1, cur);
//     this.branches.forEach( b => {
//         if(b.curCommit.id === cur.id) {
//             this.drawArrow(x1,y1 - c.RADIUS);
//         }
//     });
//     c.draw();

// };

// recursiveDrawHelper(this.root, this.x, this.y);