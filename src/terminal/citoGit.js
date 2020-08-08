class GitCommandProcessor {
    constructor() {
        let root = new Commit('root');
        let master = new Branch('master', root);
        this.branches = [master];
        this.curBranch = master;
        this.rootCommit = root;
    }

    process(cmd) {
        cmd = cmd.replace(/\s+/," ");
        let tokens = cmd.split(/\s/).filter(s => s);
        let response = "";

        if(this.startsWithGit(tokens[0])) {
            response = `${cmd}\n\tThis is custom CitoGit\n\tversion - 1.0.0\n\n`;

            switch(tokens[1]) {
                case undefined:
                    break;
                case 'log':
                    response = `${cmd}\nDisplaying log tree in dev console`;
                    this.displayCommits(this.rootCommit);
                    console.log('\n\n');
                    break; 
                case 'branch':
                    response = `${cmd}\n${this.branchCommand(tokens[2])}`;
                    break; 
                case 'commit':
                    response = `${cmd}\n${this.commitCommand(tokens[2], tokens[3])}`;
                    break; 
                case 'merge':
                    response = `${cmd}\n\t${this.mergeCommand(tokens.slice(2))}`;
                    break; 
                case 'rebase':
                    response = `${cmd}\n\t${this.rebaseCommand(tokens.slice(2))}`;
                    break;
                case 'checkout':
                    response = `${cmd}\n${this.checkoutCommand(tokens[2])}`;
                    break;
                default:
                    response = `${cmd}\n\tUnknown git command '${tokens[1]}'\n\n`;
                    break;
            }
        } else {
            response = `${cmd}\n\tError: Invalid Input\n\tI dont know what '${tokens[0]}' is. :(\n\n`;
        }

        return response;
    }

    startsWithGit(cmd) {
        const startsWithGit = new RegExp(/^git\s?/);
        let result = startsWithGit.exec(cmd);
        return result ? true : false;
    }

    branchCommand(arg) {
        let resp;
        if(!arg) {
            console.log('no args, list all branches for response');
            let branchNames = this.branches.reduce((acc,cur,i) => {
                let curBranchSymbol = this.curBranch.name === cur.name ? ' * ':' ';
                return `${acc}${i+1})${curBranchSymbol}${cur.name}\n`;
            }, "");
            resp = `All Branches:\n${branchNames}\n`;
        } else {
            if(!this.doesBranchExist(arg)) {
                this.branches.push(new Branch(arg, this.curBranch.curCommit));
                resp = `Created branch '${arg}'\n`;
            } else {
                resp = `Branch with name '${arg}' already exists\n\tno new branch created.\n\n`;
            }
        }

        return resp;
    }

    checkoutCommand(arg) {
        let resp;
        if (arg) {
            if (this.doesBranchExist(arg)) {
                this.curBranch = this.getBranchByName(arg);
                console.log('now the current branch is ' + this.curBranch.name);
                resp = `\tSwitched the '${arg}' branch.\n`;
            } else {
                resp = `Branch name '${arg}' doesnt exist\n`;
            }
        } else {
            resp = `Missing branch name: git checkout <branchName>\n`;
        }

        return resp;
    }

    commitCommand(mFlag, arg) {
        let resp;
        let msgPatt = new RegExp(/".+"/);

        if(mFlag === '-m' && arg && msgPatt.test(arg)) {
            let msg = arg.replace(/"/g, '');
            this.curBranch.addNewCommit(msg);

            resp = `Added new commit to ${this.curBranch.name} branch\n\twith message: "${msg}"\n`;
        } else if (!mFlag && arg === undefined){
            let msg = this.curBranch.name+'Commit' + this.curBranch.numCommits;
            this.curBranch.addNewCommit(msg);

            resp = `Added new commit to ${this.curBranch.name} branch\n\twith message: "${msg}"\n`;
        } else {
            resp = `Commit unsuccessful, please follow this pattern:\n\tgit commit -m "Your Message Here"\n\n`;
        }
        
        return resp;
    }

    rebaseCommand(args) {
        let resp;

        if(!args[0]) {
            return `Rebase failed, no branch provided\n`;
        }

        if (this.doesBranchExist(args[0])) {
            let rebaseOntoThisBranch = this.getBranchByName(args[0]);

            if(this.curBranch.name !== rebaseOntoThisBranch.name) {
                let commit = this.findCommonAncestor(this.curBranch, rebaseOntoThisBranch);
                let isFromSameCommitTree = commit.branchCommits.length === 0 
                                           || commit.branchCommits.some(c => this.findBranchWithThisCommit(c).name !== this.curBranch.name);

                if(!isFromSameCommitTree) {                

                    if (commit.id !== rebaseOntoThisBranch.curCommit.id) {
                        // Remove from branch commits list
                        let branchBaseCommit; 
                        commit.branchCommits = commit.branchCommits.filter(commit => {
                            if (this.findBranchWithThisCommit(commit).name !== this.curBranch.name) {
                                return true;
                            }
                            branchBaseCommit = commit;
                            return false;                  
                        });
                        console.log('base commit for %s, \n %o', this.curBranch.name, branchBaseCommit);

                        // set base of current branch on top of 'arg branch'
                        branchBaseCommit.prev = rebaseOntoThisBranch.curCommit; // rebaseC <-- newCom
                        rebaseOntoThisBranch.curCommit.branchCommits.push(branchBaseCommit); // rebaseC --> newCom

                        resp = `Rebased ${this.curBranch.name} branch onto ${rebaseOntoThisBranch.name} branch\n`;
                    } else {
                        resp = `Rebase cancelled,\n\t${this.curBranch.name} branch is already based on top of ${rebaseOntoThisBranch.name} branch.\n`;
                    } 
                } else {
                    resp = `Rebase failed, both ${this.curBranch.name} and ${rebaseOntoThisBranch.name} are in the same commit tree.\n`;
                    console.log('in live example, a fast-foward is done here'); // TODO: perform a fast-forward
                }
            } else {
                resp = `Rebase failed, cannot rebase onto self\n`;
            }
        } else {
            resp = `Branch '${args}' doesnt exist.\n`;
        }

        return resp;
    }

    mergeCommand(args) {
        let resp;
        let branchName = args[0];
        let mergeInThisBranch;
        
        if(!branchName) {
            return `Merge failed, no branch provided`;
        }

        mergeInThisBranch = this.getBranchByName(branchName);

        if(!mergeInThisBranch) {
            return 'Merge failed, this branch doesnt exist';
        }
        if(this.curBranch.name === mergeInThisBranch.name) {
            return `Merge failed, cannot merge the same branch`;
        }

        console.log(mergeInThisBranch);

        // is already up to date?
        let commonCommit = this.findCommonAncestor(this.curBranch, mergeInThisBranch);
        if (commonCommit.id == mergeInThisBranch.curCommit.id) {
            return 'Already up to date.';
        }

        // if (commonCommit.id == this.curBranch.curCommit.id) {
        //     console.log('FF possible');
        // }
        // is fast forward possible?
        let hasNextCommit = this.curBranch.curCommit.next !== null;
        let hasBranchingCommits = this.curBranch.curCommit.branchCommits.length > 0;
        if (!hasNextCommit && hasBranchingCommits) {
            // In the current branch's branchCommits, Does the other branch's commit stem from here?
            let commit = this.curBranch.curCommit.branchCommits.find(c => this.findBranchWithThisCommit(c).name === mergeInThisBranch.name);

            if(commit) {
                this.curBranch.curCommit.branchCommits = this.curBranch.curCommit.branchCommits.filter(c => c.id !== commit.id);
                this.curBranch.curCommit.next = commit;   
                this.curBranch.curCommit = mergeInThisBranch.curCommit;
                return `Merged in ${mergeInThisBranch.name} branch to ${this.curBranch.name}\n\t\tFast Forward merge\n\n`;
            } else {
                console.log('cannot fast forward merge this.');
            }
        } else {
            this.curBranch.addNewCommit('Merging with ' + mergeInThisBranch.name + ' branch');
            mergeInThisBranch.curCommit.mergedTo = this.curBranch.curCommit;
            this.curBranch.curCommit.isMergeCommit = true;
            
            return `Merge successful`;
        }

        return 'merge went bad';
    }

    /**
     * @return {boolean}
     */
    doesBranchExist(branchName) {
        console.log(branchName);
        console.log(this.branches);
        console.log(this.branches.some( b => {
            console.log(b.name, branchName);
            return b.name === branchName;
        }));
        return this.branches.some( b => b.name === branchName);
    }

    /**
     * @return {Branch}
     */
    getBranchByName(branchName) {
        return this.branches.find( b => b.name === branchName);
    }

    /**
     * This function finds the first commit both 
     * branches have in common. 
     * @param {Branch} branch1 - A git branch
     * @param {Branch} branch2 - Another git branch
     * @return {Commit} The branches' common commit or null if non found
     */
    findCommonAncestor(branch1, branch2) {
        const set = new Set();
        let commit1 = branch1.curCommit;
        let commit2 = branch2.curCommit;

        // Both branches are pointing to same commit.
        if(commit1.id == commit2.id) {
            return commit1;
        }
    
        while(commit1 !== null || commit2 !== null) {
            if(commit1 !== null) { 
                if(!set.has(commit1.id)) {
                    set.add(commit1.id);
                    commit1 = commit1.prev;
                } else return commit1;
            }
            if(commit2 !== null) { 
                if(!set.has(commit2.id)) { 
                    set.add(commit2.id);
                    commit2 = commit2.prev;
                } else return commit2;
            }
        }
 
        return null;    
    }

    findBranchWithThisCommit(commit) {
        let cur = commit;
        
        while(cur.next !== null) {
            cur = cur.next;
        }

        let result = this.branches.filter(branch => branch.curCommit.id === cur.id);
        return result[0];
    }

    /**
     * Debug function to display the commit tree.
     * DFS approach starting with main commit tree line, then branched
     * off commits.
     * @param {Commit} - a root commit
     */
    displayCommits(cur) {
        if (cur === null || cur === undefined) {
            return;
        }
        
        let b = this.branches.filter( b => b.curCommit.id === cur.id ).map(b => b.name).join(', ');
        if (this.curBranch.curCommit.id === cur.id) {
            b += ', HEAD';
        }
        let mergeCommitSym = cur.isMergeCommit ? '(M)' : '';
        console.log('id=%s | msg=%s | next=%s | prev=%s | bCommits[%s] %s %s', cur.id, cur.message, cur.next?.message, cur.prev?.message, cur.branchCommits.map(c=>c.message).join(','), b ? ' <---('+ b +') branch':'', mergeCommitSym);
        this.displayCommits(cur.next);
        
        for(var i=0; i<cur.branchCommits.length; i++) {
            this.displayCommits(cur.branchCommits[i]);
        }
    }
}
