
class DrawTree {
    constructor(root, baseX, baseY) {
        this.root = root;
        this.x = baseX;
        this.y = baseY;
    }

    setup() {
        this.drawnCommits = [];
        
    }

    draw() {
        let occupiedRows = new Set([this.y]);

        let recursiveDrawHelper = (cur, x, y) => {
            if (cur == null) {
                return;
            }
            let x1 = x, x2 = x + 100;
            let y1 = y, y2 = y;

            if (cur.next != null) {
                x2 = x + 100;
                line(x1, y1, x2, y2);
            }
            recursiveDrawHelper(cur.next, x2, y2);
            
            cur.branchCommits.forEach( c => {
                let down = 100, up = -100;
                x2 = x + 50;
                do {
                    if (!occupiedRows.has(y2 + up)) {
                        y2 = y2 + up;
                        break;
                    }
                    if (!occupiedRows.has(y2 + down)) {
                        y2 = y2 + down;
                        break;
                    }
                    down +=100;
                    up -= 100;
                } while (true);
                occupiedRows.add(y2);
                line(x1, y1, x2, y2);
                recursiveDrawHelper(c, x2, y2);
            });  
            

            let c = new DrawCommit(x1, y1, cur);
            c.draw();
        };

        recursiveDrawHelper(this.root, this.x, this.y);
    }
}