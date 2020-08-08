class Branch {
    constructor(name, commit) {
        this.name = name;
        this.curCommit = commit;
        this.numCommits = 1;
    }

    addNewCommit( msg ) {
        let c1 = new Commit(msg);

        if (this.numCommits === 1 && this.name !== 'master') {
            console.log('Branch off commit');
            this.curCommit.branchCommits.push(c1);
            c1.prev = this.curCommit;
            this.curCommit = c1;
        } else {
            console.log('Normal commit line');
            this.curCommit.next = c1;
            c1.prev = this.curCommit;
            this.curCommit = c1;
        }
        ++this.numCommits;
        return c1;
    }
}