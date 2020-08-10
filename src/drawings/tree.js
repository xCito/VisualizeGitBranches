class DrawTree {
    constructor() {
        
    }

    update() {
        
    }
    draw() {
        let commits = [];
        let x = 100, y = 200;
        for(let i=1; i<=10; i++) {
            let c = new DrawCommit(x*i, y);
            line(x * i, y, x * (1+i), y);
            c.draw();
        }
    }
}