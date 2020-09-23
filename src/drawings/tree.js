
class DrawTree {
    constructor(root, mainBranch, baseX, baseY) {
        this.root = root;
        this.branches = [mainBranch];
        this.x = baseX;
        this.y = baseY;
        this.refToDrawCommitMap = new Map();
        this.commitLinkSet = new Set();
        this.COMMIT_HEIGHT_DIST = 250;
        this.COMMIT_WIDTH_DIST = 250;
        this.listOfColor = ['#f7dd94','#ccf794','#94f7b5','#94eff7','#94a0f7','#cf94f7','#f794e8','#f79494'];

        this.availableRows = {
            POS: [ 1 ],
            NEG: [-1 ]
        };
        this.lastRowTaken;
        this.head = mainBranch;
        
        this.focusDetached = false;
        this.panDestinationX = cnvProps.panX;
        this.panDestinationY = cnvProps.panY;
        this.BORDER_LIMIT_X = windowWidth * 0.2;
        this.BORDER_LIMIT_Y = windowHeight * 0.25;
        this.PAN_LERP_SPEED = 0.05;
        
        this.setup();
    }
    
    setup() {
        let rootDCommit = new DrawCommit(this.x, this.y, this.root);
        rootDCommit.color = this.getNextColor();
        this.refToDrawCommitMap.set(this.root, rootDCommit);
        observableCommits.addObserverCallback(this.commitChangeCallback);
        observableBranches.addObserverCallback(this.branchChangeCallback);
    }

    branchChangeCallback = () => {
        let branchState = observableBranches.getState();
        if (branchState.type === 'NEW') {
            this.branches.push(branchState.branch);
        } else if (branchState.type === 'DELETE') {
            let branchToDelete = branchState.branch;
            this.branches = this.branches.filter( b => b.name !== branchToDelete.name);

            let shouldFreeUpRow = !this.branches.some( b => b.curCommit.id === branchToDelete.curCommit.id); 
            if(shouldFreeUpRow) {
                let drawCommit = this.refToDrawCommitMap.get(branchToDelete.curCommit);
                this.freeRowY( this.calcRowFromY(drawCommit.y) );
            }
        } else if (branchState.type === 'HEAD') {
            this.head = branchState.branch;
            this.focusDetached = false;
            this.setPanDestination(this.head.curCommit);
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
            newDrawCommit.color = this.getNextColor();
        } else {
            newDrawCommit.color = prevDCommit.color;
        }

        // get draw commit of prev commit ref.
        this.linkTwoCommits(prevDCommit, newDrawCommit);

        this.focusDetached = false;
        this.setPanDestination(commitRef);
    }

    getNextColor() {
        let color = this.listOfColor.shift(); 
        this.listOfColor.push(color);
        return color;
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
        return (yValue - this.y) / this.COMMIT_HEIGHT_DIST;
    }
    freeRowY( row ) {
        console.log(row);
        console.log(this.availableRows);
        if(row < 0) {
            this.availableRows['NEG'].push( row );
            this.availableRows['NEG'].sort( (a,b) => a - b);
        } else {
            this.availableRows['POS'].push( row );
            this.availableRows['POS'].sort( (a,b) => a - b);
        }
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
                console.warn('this commit was not in DrawCommit Map\nMake sure to notify commit observable of all new commits\n', curCommit);
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
            
            curCommit.branchCommits.forEach( c => redrawHelper(c));
            redrawHelper(curCommit.next);
        };

        this.commitLinkSet.clear();
        this.availableRows = {
            POS: [ 1 ],
            NEG: [-1 ]
        };
        redrawHelper(this.root);

        // After all commits have been draw, link merged commits
        this.refToDrawCommitMap.forEach( (dCommit,commitRef, map) => {
            if(commitRef.mergedTo) {
                this.linkTwoCommits(dCommit, map.get(commitRef.mergedTo));
            }
        }); 
        this.setPanDestination(this.head.curCommit);
        
    }

    setPanDestination(commit) {
        let leftLimit = this.BORDER_LIMIT_X; 
        let rightLimit = windowWidth - this.BORDER_LIMIT_X; 
        let upperLimit = this.BORDER_LIMIT_Y;
        let bottomLimit = windowHeight-this.BORDER_LIMIT_Y;
        let commitX, commitY;

        if (!commit) {
            return;
        }
        let dCommit = this.refToDrawCommitMap.get(commit);
        commitX = dCommit.destinationX + cnvProps.panX;
        commitY = dCommit.destinationY + cnvProps.panY;
        
        if(commitX > rightLimit) {
            this.panDestinationX += rightLimit - commitX;
        } else if (commitX < leftLimit) {
            this.panDestinationX += leftLimit - commitX;
        }
        
        if(commitY < upperLimit) {
            this.panDestinationY += (windowHeight/2) - commitY;
        } else if (commitY > bottomLimit) {
            this.panDestinationY += (windowHeight/2) - commitY;
        }
    }

    updatePanViewToCommit() {
        if (this.focusDetached) {
            return;
        }

        if(cnvProps.panX !== this.panDestinationX) {
            cnvProps.panX = lerp(cnvProps.panX, this.panDestinationX, this.PAN_LERP_SPEED);
            cnvProps.panX = abs(cnvProps.panX - this.panDestinationX) < 0.5 ? this.panDestinationX : cnvProps.panX;
        }
        if(cnvProps.panY !== this.panDestinationY) {
            cnvProps.panY = lerp(cnvProps.panY, this.panDestinationY, this.PAN_LERP_SPEED);
            cnvProps.panY = abs(cnvProps.panY - this.panDestinationY) < 0.5 ? this.panDestinationY : cnvProps.panY;
        }
    }

    draw() {
        this.commitLinkSet.forEach( link => {
            link.draw();
        }); 
        this.refToDrawCommitMap.forEach( (drawCommit, commitRef) => {
            drawCommit.draw();
            let offset = 0;
            let branchNames = this.branches.filter( b => b.curCommit.id === commitRef.id ).map( b => b.name );
            if (branchNames.length !== 0) {
                this.drawArrow(drawCommit.x + offset, drawCommit.y + offset - drawCommit.RADIUS, commitRef.id === this.head.curCommit.id, branchNames); 
            }
            offset += 2;
        });

        this.updatePanViewToCommit();
    }
    
    drawArrow(x, y, isHead, names) {
        push();
        (isHead) ? fill(0) : fill(255);
        beginShape();
        vertex(x, y);  
        vertex(x+10, y-15);
        vertex(x+5, y-15);
        vertex(x+5, y-20);
        vertex(x-5, y-20);
        vertex(x-5, y-15);
        vertex(x-10, y-15);
        vertex(x, y);
        endShape();
        push();
        fill(0).textSize(20);
        names.forEach( (name, i) => {
            text(name, x-5, y-25 * (i+1));
        });
        pop();
        pop();
    }
}