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

    /**
     * @param {Branch} branch - a branch instance
     * @param {string} name - name for the new branch being created
     * @return {Branch} deep copy of branch passed in.
     */
    static copyBranch(branch, name) {
        let newBranch = new Branch(name, branch.curCommit);
        newBranch.numCommits = branch.numCommits;

        return newBranch;
    }
}