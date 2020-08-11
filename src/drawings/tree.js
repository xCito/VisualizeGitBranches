
class DrawTree {
    constructor(root) {
        this.root = root;
    }

    setup() {
        this.drawnCommits = [];
        
    }

    draw() {
        let x = 100, y = 200, i = 1;
        this.cur = this.root;
        while(this.cur != null) {
            let x1 = x * (i+1);
            let x2 = x * (i+2);
            line(x1, y, x2, y);
            let c = new DrawCommit(x1, y, this.cur);
            c.draw();
            this.cur = this.cur.next;
            ++i;
        }
    }
}