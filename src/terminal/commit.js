
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
        return randNum.toString(16).toUpperCase();
    }

    /**
     * @param {Commit} commit - new branching commit
     */
    addBranchingCommit( commit ) {
        this.branchCommits.push(commit);
        commit.prev = this;
    }


    isInBranchingCommits( commit ) {
        return this.branchCommits.some( c => c.id === commit.id);
    }

    /**
     * @param {Commit} commit - branching commit to remove
     * @return {boolean} true if found and removed, false otherwise
     */
    removeBranchingCommit( commit ) {
        let found = false;
        this.branchCommits = this.branchCommits.filter( c => {
            if (c.id !== commit.id) {
                return true;
            } else {
                console.log('found!');
                found = true;
            }
        });

        return found;
    }

    
    /**
     * @param {Commit} commit - commit to set next
     */
    setNextCommit( commit ) {
        this.next = commit;
        commit.prev = this;
    }
}