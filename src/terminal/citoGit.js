class GitCommandProcessor {
    constructor() {
        let root = new Commit('root');
        let master = new Branch('master', root);
        this.branches = [master];
        this.curBranch = master;
        this.rootCommit = root;
    }

    process(inputCmd) {

        let cmd = this.processCommand(inputCmd);
        console.log(cmd);
        let prefix = `${inputCmd}\n`;
        let postfix = '\n\n';
        let response;

        if (this.startsWithGit(cmd.original)) {
            response = `This is custom CitoGit\n\tversion - 1.0.0\n\n`;

            switch (cmd.command) {
                case undefined: // should not get here
                    break;
                case 'log':
                    response = `Displaying log tree in dev console`;
                    this.displayCommits(this.rootCommit);
                    console.log('\n\n');
                    break; 
                case 'branch':
                    response = `${this.branchCommand(cmd.flags, cmd.args)}`;
                    break; 
                case 'switch':
                    response = `${this.switchCommand(cmd.flags, cmd.args)}`;
                    break; 
                case 'commit':
                    response = `${this.commitCommand(cmd.flags, cmd.args)}`;
                    break; 
                case 'checkout':
                    response = `${this.checkoutCommand(cmd.flags, cmd.args)}`;
                    break;
                case 'merge':
                    response = `${this.mergeCommand(cmd.flags, cmd.args)}`;
                    break; 
                case 'rebase':
                    response = `${this.rebaseCommand(cmd.flags, cmd.args)}`;
                    break;
                default:
                    response = ` Unknown git command '${cmd.command}'`;
                    break;
            }
        } else {
            response = ` Error: Invalid Input\n\tI dont know what '${cmd.original}' is. :(`;
        }

        return prefix + response + postfix;
    }

    startsWithGit(cmd) {
        const startsWithGit = new RegExp(/^git\s?/);
        let result = startsWithGit.exec(cmd);
        return result ? true : false;
    }

    processCommand(cmd) {
        let commandObj = {
            original: null,
            command: null,
            flags: [],
            args: []
        };
        cmd = cmd.trim();
        commandObj.original = cmd;
        commandObj.flags = this.getFlags(cmd);

        let tempCmd = this.extractFlags(cmd)
                                .replace(/\s+/g," ")
                                .trim();
        commandObj.args = this.extractArgs(tempCmd);
        commandObj.command = tempCmd.split(/\s+/)[1];
        return commandObj;
    }

    
    getFlags(cmd) {
        const flagsPattern = new RegExp(/--[a-z]+|-[a-z]+/, 'gi');
        let flags = cmd.match(flagsPattern);
        let flagArr = [];
        
        if (flags) {
         flagArr = [...cmd.match(flagsPattern)]
            .reduce((flags, str) => {
                if(str.search(/^--[a-z]{2,}$/im) !== -1)
                    flags.push(str);
                else if( str.search(/^-[a-z]$/im) !== -1)
                    flags.push(str)
                else
                    flags.push( ...str.match(/[a-z]/gi).map( f => `-${f}`) );
                return flags;
            }, []);
        }
        
        return [...new Set(flagArr)];
    }

    extractFlags(cmd) {
        const flagsPattern = new RegExp(/--[a-z]+|-[a-z]+/, 'gi');
        let filteredCmd = "";
        if (flagsPattern.test(cmd)) {
            filteredCmd = cmd.replace(flagsPattern, '');
        } else {
            filteredCmd = cmd;
        }
        return filteredCmd;
    }

    extractArgs(cmdWithoutFlags) {
        let quotedArg = cmdWithoutFlags.match(/".*"+?/);
        let cmd = cmdWithoutFlags;
        let allArgs = [];
        if(quotedArg) {
            allArgs.push(...quotedArg);
            cmd = cmdWithoutFlags.replace(quotedArg, '');
        } 
        let args = cmd.split(/\s/).filter(s => s).slice(2);
        allArgs.unshift(...args);
        return allArgs;
    }

    // ---------------------------------- BRANCH ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    branchCommand(flags, args) {
        let resp = '';

        if(flags.length == 0) {
            
            if(args.length === 0) { // list all branches
                let branchNames = this.getListOfAllBranches();
                resp = `${branchNames}`;
            } else {                // create branch(s);
                resp = this.createBranches(args);
            }
        } else {
            for(let flag of flags) {
                let warnMsg = `\t${flag} and ${flags.filter(f => f != flag).join()}` +  
                                ' dont work together\n\tor the other flag(s) are not available';
                switch(flag) {
                    case '-m':
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length > 2 || args.length < 2) 
                            resp = ` 2 arguments are required`;
                        else { 
                            resp = this.moveBranch(args);
                        }
                        break;
                    case '-c':
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length > 2 || args.length < 2) 
                            resp = ` 2 branches are required`;
                        else { 
                            resp = this.copyBranch(args);
                        }
                        break;
                    case '-d': 
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length < 1) 
                            resp = ` Atleast 1 branch is required`;
                        else 
                            resp = this.deleteBranches(args);
                        break;
                    case '--list': 
                        if (flags.length > 1) 
                                resp = warnMsg;
                        else
                            resp = `${this.getListOfAllBranches()}`;
                        break;
                    default:
                        resp = ` ${flag} not available`;
                        break;
                }
            }
        }

        return resp;
    }

    /**
     * @return {string} - numbered list of all branch. 
     */
    getListOfAllBranches() {
        return this.branches
            .map( (b) => this.curBranch.name !== b.name ? b.name : `* ${b.name}`)
            .map( (bName,i) => `  ${i+1}) ${bName}`)
            .join('\n');
    }

    /**
     * @param {Array<string>} names - names of branches to create.
     * @return {string} - console output message.  
     */
    createBranches(names) {
        let resp = '';
        for(let branchName of names) {
            if ( this.doesBranchExist(branchName) ) {
                resp = ` Branch with name '${branchName}' already exists\n no new branch created.`;
                return resp;
            }
        }

        names.forEach( (branchName, i) => {
            this.branches.push(new Branch(branchName, this.curBranch.curCommit));
            resp += ` Created new branch '${branchName}' ${i === names.length-1 ? '' : '\n'}`;
        });

        return resp;
    }

    /**
    * @param {Array<string>} names - names of branches to delete.
    * @return {string} - console output message.  
    */
    deleteBranches(names) {
        let resp = '';
        for(let branchName of names) {
            if ( !this.doesBranchExist(branchName) ) {
                resp = ` '${branchName}' doesnt exist\n no branch deleted.`;
                return resp;
            }
        }

        names.forEach( (branchName, i) => {
            this.branches = this.branches.filter( b => b.name !== branchName);
            resp += ` '${branchName}' branch deleted ${i === names.length - 1 ? '' : '\n'}`;
        });

        return resp;
    }

    /**
     * @param {Array<string>} args - array with two branch names.
     * @return {string} console output message.
     */
    copyBranch(args) {
        let target = args[0];
        let copy = args[1];
        let resp;
        if(!this.doesBranchExist(target))
            resp = ` ${target} branch does not exist\n\tcopy failed`;
        else if (this.doesBranchExist(copy)) {
            resp = ` branch with name '${copy}' already exists\n\tcopy failed`;     
        } else {
            let branchCopy = Branch.copyBranch( this.getBranchByName(target), copy );
            this.branches.push(branchCopy);
            resp = ` branch copied!`;
        }
        return resp;
    }

    /**
     * @param {Array<string>} args - specifically length 2, holding name of branch and new branch name.
     * @return {string} console output message.
     */
    moveBranch(args) {
        let target = args[0];
        let move = args[1];
        let resp;
        if(!this.doesBranchExist(target))
            resp = ` ${target} branch does not exist\n\tmove failed`;
        else if (this.doesBranchExist(move)) {
            resp = ` branch with name '${move}' already exists\n\tcopy failed`;     
        } else {
            this.getBranchByName(target).name = move;
            resp = ` branch moved/renamed!`;
        }
        return resp;
    }

    // ---------------------------------- SWITCH ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    switchCommand(flags, args) {
        let resp;

        if(flags.length === 0) {
            if(args.length > 1) {
                resp = ` switch unsuccessful, too many arguments\n\tgit switch <branchName>`;
            } else if (args.length === 0){
                resp = ` switch unsuccessful, no arguments provided\n\tgit switch <branchName>`;
            } else 
                resp = this.switchToDifferentBranch(args[0]);
        } else {
            for(let flag of flags) {
                switch(flag) {
                    case '-c':
                    case '--create':
                        if (args.length == 0 || args[0] === undefined)
                            resp = ` no branch name provided, follow this format\n\tgit switch [-c|--create] <branchName>\n\n`;
                        else 
                            resp = `${this.createBranches([args[0]])}\n${this.switchToDifferentBranch(args[0])}\n`;
                        break;
                    default:
                        resp = ` ${flag} not available`;
                        break;
                }
            }
        }
        return resp;
    }

    /**
     * @param {string} branchName - a branch name.
     * @return {string} - console ouput message.
     */
    switchToDifferentBranch(branchName) {
        let resp;
        if (!this.doesBranchExist(branchName)) {
            resp = ` branch switch/change failed, ${branchName} doesnt exist`;
        } else {
            if(this.curBranch.name === branchName) {
                resp = ` already in ${branchName} branch`;
            } else {
                this.curBranch = this.getBranchByName(branchName);
                resp = ` switch successful, now in '${branchName}' branch`;
            }
        }
        return resp;
    }
    // ---------------------------------- CHECKOUT ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    checkoutCommand(flags, args) {
        let resp;
        if (flags.length === 0) {
            if(args.length === 0) 
                resp = ` no branch name provided, follow this format\n\tgit checkout <branchName>`;
            else if (args.length > 1)
                resp = ` too many arguments, follow this format\n\tgit checkout <branchName>`;
            else 
                resp = this.switchToDifferentBranch(args[0]);
        } else {
            for(let flag of flags) {
                switch(flag) {
                    case '-b':
                        if (args.length == 0)
                            resp = `no branch name provided, follow this format\n\tgit checkout -b <branchName>\n\n`;
                        else if (args.length > 1)
                            resp = `too many arguments, follow this format\n\tgit checkout -b <branchName>\n\n`;
                        else {
                            let bName = args[0];
                            resp = this.createBranches([bName]) + '\n' +
                                    this.switchToDifferentBranch(bName);
                        }
                        break;
                    default:
                        resp = `${flag} not available`;
                        break;
                }
            }
        }

        return resp;
    }

    // ---------------------------------- COMMIT ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    commitCommand(flags, args) {
        let resp;
        
        if(flags.length == 0) {
            if(args.length > 0) {
                resp = `follow this format:\n\tgit commit -m "Your Message Here"\n\n`;
            } else {
                this.addCommitToBranch(this.curBranch, `"${this.curBranch.name + this.curBranch.numCommits}"`);
                resp = ` Commit successful using default message`;
            }
        } else {
            for(let flag of flags) {
                let warnMsg = `\t${flag} and ${flags.filter(f => f != flag).join()}` +  
                                ' dont work together\n\tor the other flag(s) are not available';
                switch(flag) {
                    case '-m':
                        if (flags.some(f => f === '--amend'))
                            break;
                        else if (args.length == 0 || args[0] === undefined)
                            resp = ` no message provided, follow this format:\n\tgit commit -m "Your Message Here"`;
                        else 
                            resp = this.addCommitToBranch(this.curBranch, args[0]);
                        break;
                    case '--amend':
                        if ( !flags.some(f => f === '-m') )
                            resp = ` missing -m flag, follow this format:\n\tgit commit --amend -m "Your Message Here"`
                        else if (args.length === 0) 
                            resp = ` no message provided, follow this format:\n\tgit commit -m "Your Message Here"`;
                        else     
                            resp = this.amendBranchCommit(this.curBranch, args[0]);
                        break;    
                    default:
                        resp = `${flag} not available`;
                        break;
                }
            }
        }
        
        return resp;
    }

    /**
     * @param {Branch} branch - branch instance
     * @param {string} msg - the commit message with quotes
     */
    addCommitToBranch(branch, msg) {
        let msgPatt = /".*"/g;
        let resp;
        if (msg.search(msgPatt) === -1) {
            resp = `Commit unsuccessful, please follow this format\n\tgit commit -m "Your Message Here"\n\n`;
        } else {
            let message = msg.replace(/"/g, '');
            branch.addNewCommit(message);
            resp = 'Commit successful';
        }
        return resp;
    }

        /**
     * @param {Branch} branch - branch instance
     * @param {string} msg - the commit message with quotes
     */
    amendBranchCommit(branch, msg) {
        let msgPatt = /".*"/g;
        let resp;
        if (msg.search(msgPatt) === -1) {
            resp = ` Amend unsuccessful, please follow this format\n\tgit commit --amend -m "Your Message Here"`;
        } else {
            let message = msg.replace(/"/g, '');
            branch.curCommit.message = message;
            resp = ' Amend successful';
        }
        return resp;
    }
    // ---------------------------------- REBASE ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    rebaseCommand(flags, args) {
        let resp;

        if (flags.length === 0) {
            if(args.length === 0) {
                resp = ' Rebase failed, missing a branch name';
            } else if (args.length > 1){
                resp = ' Too many arguments';
            } else if (!this.doesBranchExist(args[0])){
                resp = ' branch doesnt exist';
            } else {
                let target = this.getBranchByName(args[0]);
                let commonCommit = this.findCommonAncestor(target, this.curBranch);

                if(target.curCommit.id === commonCommit.id) {
                    resp = ' already upto date';
                } else if(this.curBranch.curCommit.id === commonCommit.id) {
                    this.fastForwardBranch(target, this.curBranch, commonCommit);
                    resp  = ` fastforwarded ${this.curBranch.name} branch to ${target.name} branch`;
                } else {        
                    this.rebaseBranch(target, this.curBranch, commonCommit);
                    resp  = ` rebased ${this.curBranch.name} branch onto ${target.name} branch`;
                }
            }
        } else {
            for(let flag of flags) {
                switch(flag) {
                    default:
                        resp = `${flag} not available`;
                        break;
                }

            } 
        }

        // TODO: Make rebase command follow the new format!!!




        // if(!args[0]) {
        //     return `Rebase failed, no branch provided\n`;
        // }

        // if (this.doesBranchExist(args[0])) {
        //     let rebaseOntoThisBranch = this.getBranchByName(args[0]);

        //     if(this.curBranch.name !== rebaseOntoThisBranch.name) {
        //         let commit = this.findCommonAncestor(this.curBranch, rebaseOntoThisBranch);
        //         let isFromSameCommitTree = commit.branchCommits.length === 0 
        //                                    || commit.branchCommits.some(c => this.findBranchWithThisCommit(c).name !== this.curBranch.name);

        //         if(!isFromSameCommitTree) {                

        //             if (commit.id !== rebaseOntoThisBranch.curCommit.id) {
        //                 // Remove from branch commits list
        //                 let branchBaseCommit; 
        //                 commit.branchCommits = commit.branchCommits.filter(commit => {
        //                     if (this.findBranchWithThisCommit(commit).name !== this.curBranch.name) {
        //                         return true;
        //                     }
        //                     branchBaseCommit = commit;
        //                     return false;                  
        //                 });
        //                 console.log('base commit for %s, \n %o', this.curBranch.name, branchBaseCommit);

        //                 // set base of current branch on top of 'arg branch'
        //                 branchBaseCommit.prev = rebaseOntoThisBranch.curCommit; // rebaseC <-- newCom
        //                 rebaseOntoThisBranch.curCommit.branchCommits.push(branchBaseCommit); // rebaseC --> newCom

        //                 resp = `Rebased ${this.curBranch.name} branch onto ${rebaseOntoThisBranch.name} branch\n`;
        //             } else {
        //                 resp = `Rebase cancelled,\n\t${this.curBranch.name} branch is already based on top of ${rebaseOntoThisBranch.name} branch.\n`;
        //             } 
        //         } else {
        //             resp = `Rebase failed, both ${this.curBranch.name} and ${rebaseOntoThisBranch.name} are in the same commit tree.\n`;
        //             console.log('in live example, a fast-foward is done here'); // TODO: perform a fast-forward
        //         }
        //     } else {
        //         resp = `Rebase failed, cannot rebase onto self\n`;
        //     }
        // } else {
        //     resp = `Branch '${args}' doesnt exist.\n`;
        // }

        return resp;
    }

    /**
     * @param {Branch} targetBranch - branch that is being rebased on to. (j)
     * @param {Branch} sourceBranch - branch that is being fastforwarded on to. (m)
     * @param {Commit} branchingCommit - commit that will be detached and rebased.
     */
    fastForwardBranch(targetBranch, sourceBranch, branchingCommit) {
        let cur = targetBranch.curCommit;
        let commitA;
        while (cur.prev.id !== branchingCommit.id) { 
            cur = cur.prev; 
        }
        commitA = cur;

        // Remove branchingCommit from list of branchCommits
        sourceBranch.curCommit.branchCommits = sourceBranch.curCommit.branchCommits.filter(c => c.id !== commitA.id);

        // Set targetBranch next commit to be the branchingCommit
        sourceBranch.curCommit.next = commitA; 
        commitA.prev = sourceBranch.curCommit;  

        // Move targetBranch to other branch's current commit
        let cur2 = branchingCommit;
        while (cur2.next !== null) {
            cur2 = cur2.next;
        }
        sourceBranch.curCommit = cur2;
    }

    /**
     * @param {Branch} targetBranch - the branch that we are rebasing onto.
     * @param {Branch} sourceBranch - the branch that is being detached and moved up.
     * @param {Commit} branchingCommit - the two branches' common commit.
     */
    rebaseBranch(targetBranch, sourceBranch, branchingCommit) {
        let cur = sourceBranch.curCommit;
        let sourceFirstCommit;
        while (cur.prev.id !== branchingCommit.id) { 
            cur = cur.prev; 
        }
        sourceFirstCommit = cur;

        // Remove branch base from list of branchCommits
        branchingCommit.branchCommits = branchingCommit.branchCommits.filter(c => c.id !== sourceFirstCommit.id);

        // Add source branch base to target branch's list of branchCommits
        targetBranch.curCommit.branchCommits.push( sourceFirstCommit );
        sourceFirstCommit.prev = targetBranch.curCommit;
    }

    // ---------------------------------- MERGE ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
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

    // ---------------------------------- UTILTIY / HELPER ---------------------------------- //
    /**
     * @param {string} branch - a branch name 
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
     * @param {string} branch - a branch name.
     * @return {Branch} Returns respective Branch object or undefined if not found.
     */
    getBranchByName(branchName) {
        return this.branches.find( b => b.name === branchName);
    }

    /**
     * Finds the first commit both branches share. 
     * @param {Branch} branch1 - A branch
     * @param {Branch} branch2 - Another branch
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

    // TODO: double check this function
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
