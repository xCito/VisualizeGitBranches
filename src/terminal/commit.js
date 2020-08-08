
class Commit {
    constructor(msg) {
        this.id = this.createId();
        this.message = msg;
        this.prev = null;
        this.next = null;
        this.branchCommits = [];
        this.mergedTo = null;
        this.isMergeCommit = false;
    }

    createId() {
        let randNum = Math.floor(((Math.random() * 899999) + 100000) * 100);
        randNum += Math.floor(Math.random() * 10);
        return randNum.toString(16);
    }
}