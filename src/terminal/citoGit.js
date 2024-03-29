class GitCommandProcessor {
    constructor() {
        let root = new Commit('root');
        let master = new Branch('master', root);
        this.branches = [master];
        this.curBranch = master;
        this.head = master.curCommit;
        this.rootCommit = root;
        observableBranches.setState(master, 'NEW');

        this.PREFIX = `  `;
        this.POSTFIX = `\n`;
    }

    process(inputCmd) {
        let cmd = this.processCommand(inputCmd);
        let response;

        if (this.startsWithGit(cmd.original)) {
            response = `This is custom CitoGit\n version - 1.0.0`;

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
                case 'reset':
                    response = `${this.resetCommand(cmd.flags, cmd.args)}`;
                    break;
                case 'help':
                    response = `${this.helpCommand(cmd.flags, cmd.args)}`;
                    break;
                default:
                    response = `Unknown git command '${cmd.command}'`;
                    break;
            }
        } else {
            response = this.errorMsg(`Error: Unknown command '${cmd.original}' :(`);
        }

        return this.PREFIX + response + this.POSTFIX;
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
        const flagsPattern = new RegExp(/\s--[a-z]+|\s-[a-z]+/, 'gi');
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
        const flagsPattern = new RegExp(/\s--[a-z]+|\s-[a-z]+/, 'gi');
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
                let warnMsg = `${flag} and ${flags.filter(f => f != flag).join()} ` +  
                                'dont work together or the other flag(s) are not available';
                switch(flag) {
                    case '-m':
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length > 2 || args.length < 2) 
                            resp = `2 arguments are required`;
                        else { 
                            resp = this.moveBranch(args);
                        }
                        break;
                    case '-c':
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length > 2 || args.length < 2) 
                            resp = `2 branches are required`;
                        else { 
                            resp = this.copyBranch(args);
                        }
                        break;
                    case '-d': 
                        if (flags.length > 1) 
                            resp = warnMsg;
                        else if (args.length < 1) 
                            resp = `Atleast 1 branch is required`;
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
                        resp = `${flag} not available`;
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
            .map( (bName,i) => `${i+1}) ${bName}`)
            .join(`\n${this.PREFIX}`) + '\n';
    }

    /**
     * @param {Array<string>} names - names of branches to create.
     * @return {string} - console output message.  
     */
    createBranches(names) {
        let resp = '';
        names = [...new Set(names)];
        for(let branchName of names) {
            if ( this.doesBranchExist(branchName) ) {
                resp = this.warnMsg(`Branch with name '${branchName}' already exists\n${this.PREFIX}no new branch created.`);
                return resp;
            }
        }

        names.forEach( (branchName, i) => {
            let branch = new Branch(branchName, this.curBranch.curCommit);
            this.branches.push(branch);
            resp += `Created new branch '${branchName}' ${i === names.length-1 ? '' : '\n' + this.PREFIX}`;
            observableBranches.setState(branch, 'NEW');
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
                resp = this.warnMsg(`'${branchName}' doesnt exist\n no branch deleted.`);
                return resp;
            }
            if (this.curBranch.name === branchName) {
                resp = this.warnMsg(`Cannot delete '${branchName}'\n currently being referenced (youre on that branch)`);
                return resp;
            }
         }

        names.forEach( (branchName, i) => {
            let branchToDelete = this.getBranchByName(branchName);
            this.branches = this.branches.filter( b => b.name !== branchName);
            resp += `'${branchName}' branch deleted ${i === names.length - 1 ? '' : '\n'}`;
            observableBranches.setState(branchToDelete, "DELETE");
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
            resp = this.errorMsg(`${target} branch does not exist\n\tcopy failed`);
        else if (this.doesBranchExist(copy)) {
            resp = this.errorMsg(`branch with name '${copy}' already exists\n\tcopy failed`);     
        } else {
            let branchCopy = Branch.copyBranch( this.getBranchByName(target), copy );
            this.branches.push(branchCopy);
            observableBranches.setState(branchCopy, "NEW");
            resp = `branch copied!`;
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
            resp = this.errorMsg(`${target} branch does not exist\n\tmove failed`);
        else if (this.doesBranchExist(move)) {
            resp = this.errorMsg(`branch with name '${move}' already exists\n\tcopy failed`);
       } else {
            this.getBranchByName(target).name = move;
            resp = `branch moved/renamed!`;
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
                resp = `switch unsuccessful, too many arguments\n\tgit switch <branchName>`;
            } else if (args.length === 0){
                resp = `switch unsuccessful, no arguments provided\n\tgit switch <branchName>`;
            } else 
                resp = this.switchToDifferentBranch(args[0]);
        } else {
            for(let flag of flags) {
                switch(flag) {
                    case '-c':
                    case '--create':
                        if (args.length == 0 || args[0] === undefined)
                            resp = `no branch name provided, follow this format\n git switch [-c|--create] <branchName>`;
                        else 
                            resp = `${this.createBranches([args[0]])}\n ${this.switchToDifferentBranch(args[0])}`;
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
     * @param {string} branchName - a branch name.
     * @return {string} - console ouput message.
     */
    switchToDifferentBranch(branchName) {
        let resp;
        if (!this.doesBranchExist(branchName)) {
            resp = this.errorMsg(`branch switch/change failed, '${branchName}' branch doesnt exist`);
        } else {
            if(this.curBranch.name === branchName) {
                resp = `already in ${branchName} branch`;
            } else {
                this.curBranch = this.getBranchByName(branchName);
                observableBranches.setState(this.curBranch, 'HEAD');
                resp = `switch successful, now in '${branchName}' branch`;
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
                resp = `no branch name provided, follow this format\n\tgit checkout <branchName>`;
            else if (args.length > 1)
                resp = `too many arguments, follow this format\n\tgit checkout <branchName>`;
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
                            resp = this.createBranches([bName]) + '\n ' +
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
                resp = `Commit successful using default message`;
            }
        } else {
            for(let flag of flags) {
                let warnMsg = `${flag} and ${flags.filter(f => f != flag).join()}` +  
                                ' dont work together\n\tor the other flag(s) are not available';
                switch(flag) {
                    case '-m':
                        if (flags.some(f => f === '--amend'))
                            break;
                        else if (args.length == 0 || args[0] === undefined)
                            resp = `no message provided, follow this format:\n\tgit commit -m "Your Message Here"`;
                        else 
                            resp = this.addCommitToBranch(this.curBranch, args[0]);
                        break;
                    case '--amend':
                        if ( !flags.some(f => f === '-m') )
                            resp = `missing -m flag, follow this format:\n\tgit commit --amend -m "Your Message Here"`
                        else if (args.length === 0) 
                            resp = `no message provided, follow this format:\n\tgit commit -m "Your Message Here"`;
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
            let commit = branch.addNewCommit(message);
            observableCommits.setState(commit, branch, "NEW");
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
            resp = `Amend unsuccessful, please follow this format\n\tgit commit --amend -m "Your Message Here"`;
        } else {
            let message = msg.replace(/"/g, '');
            branch.curCommit.message = message;
            resp = 'Amend successful';
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
                resp = this.errorMsg('Rebase failed, missing a branch name');
            } else if (args.length > 1){
                resp = 'Too many arguments';
            } else if (!this.doesBranchExist(args[0])){
                resp = 'branch doesnt exist';
            } else {
                let target = this.getBranchByName(args[0]);
                let commonCommit = this.findCommonAncestor(target, this.curBranch);
                let stemCommit = this.getCommitBeforeSpecificCommit(target, commonCommit);

                if(target.curCommit.id === commonCommit.id) {
                    resp = 'already upto date';
                } else if(this.curBranch.curCommit.id === commonCommit.id || commonCommit.isInBranchingCommits(stemCommit)) {
                    this.fastForwardBranch(target, this.curBranch, commonCommit);
                    resp  = `fastforwarded ${this.curBranch.name} branch to ${target.name} branch`;
                } else {
                    this.rebaseBranch(target, this.curBranch, commonCommit);
                    resp  = `rebased ${this.curBranch.name} branch onto ${target.name} branch`;
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
        sourceBranch.curCommit.removeBranchingCommit( commitA );

        // Set targetBranch next commit to be the branchingCommit
        sourceBranch.curCommit.setNextCommit( commitA );

        // Move targetBranch to other branch's current commit
        let cur2 = branchingCommit;
        while (cur2.next !== null) {
            cur2 = cur2.next;
        }

        // Reset number of commits
        targetBranch.numCommits = 0;

        sourceBranch.curCommit = cur2;
        observableBranches.setState(null, 'UPDATE');
    }

    /**
     * @param {Branch} targetBranch - the branch that we are rebasing onto. (J)
     * @param {Branch} sourceBranch - the branch that is being detached and moved up. (M)
     * @param {Commit} branchingCommit - the two branches' common commit.
     */
    rebaseBranch(targetBranch, sourceBranch, branchingCommit) {
        // Find stem commit (first commit to branch off) of the source branch
        let sourceFirstCommit = this.getCommitBeforeSpecificCommit(sourceBranch, branchingCommit);
      
        // Remove branch base from list of branchCommits
        branchingCommit.removeBranchingCommit( sourceFirstCommit );

        // Add source branch base to target branch's list of branchCommits
        targetBranch.curCommit.addBranchingCommit( sourceFirstCommit );
        
        observableBranches.setState(null, 'UPDATE');   
    }

    // ---------------------------------- MERGE ---------------------------------- //
    /**
     * @param {Array<string>} flags
     * @param {Array<string>} args
     * @return {string} - command result message
     */
    mergeCommand(flags, args) {
        let resp;
        
        if (flags.length === 0) {
            if(args.length === 0) {
                resp = `Merge failed, no branch provided`;
            } else if (args.length > 1) {
                resp = 'Too many arguments';
            } else if (!this.doesBranchExist(args[0])) {
                resp = `${args[0]} branch doesnt exist`;
            } else {
                let target = this.getBranchByName(args[0]);
                let commonCommit = this.findCommonAncestor(this.curBranch, target);
                
                if (commonCommit.id === target.curCommit.id) {
                    resp = 'Already up to date.';
                } else if (commonCommit.id === this.curBranch.curCommit.id) {
                    this.fastForwardBranch(target, this.curBranch, commonCommit);
                    resp = `Fast Forwarded ${this.curBranch.name} branch onto ${target.name} branch`;
                } else if ( target.curCommit.mergedTo ) { 
                    resp = 'Already up to date.';
                } else {
                    this.mergeBranch(target, this.curBranch, commonCommit);
                    resp = `Merge successful`;
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
        return resp;
    }
    
    /**
     * @param {Branch} targetBranch - branch that is being merged in. (j)
     * @param {Branch} sourceBranch - branch taking in other branch's commits. (m)
     * @param {Commit} branchingCommit - common commit
     */
    mergeBranch(targetBranch, sourceBranch, branchingCommit) {
        let mergeCommit = sourceBranch.addNewCommit('Merging with ' + targetBranch.name + ' branch');
        targetBranch.curCommit.mergedTo = mergeCommit;
        sourceBranch.curCommit.isMergeCommit = true;
        observableCommits.setState(mergeCommit, null, "NEW");
        observableBranches.setState(null, 'UPDATE'); 
    }

    // ---------------------------------- RESET ---------------------------------- //
    resetCommand(flags, args) {

    }

    // ---------------------------------- HELP ---------------------------------- //
    helpCommand(flags, args) {
        let cmds = [
            {name: 'log', desc: 'display the commit graph **dev console only'},
            {name: 'branch', desc: 'list | create | move | copy branches'},
            {name: 'switch', desc: 'switch branches'},
            {name: 'commit', desc: 'commit changes to branch'},
            {name: 'checkout', desc: 'pointing to a commit ref'},
            {name: 'merge', desc: 'merging git changes'},
            {name: 'rebase', desc: 'another form of merging'},
            {name: 'reset', desc: 'idk'},
            {name: 'help', desc: 'displays this menu'}
        ];
        
        return "\nGit Commands\n" + cmds.map( v => {
            return `  ${v.name.padEnd(20, ' ')}${v.desc}\n`;
        }).join('') + '\n';
    }

    // ---------------------------------- UTILTIY / HELPER ---------------------------------- //
    /**
     * @param {string} branch - a branch name 
     * @return {boolean}
     */
    doesBranchExist(branchName) {
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

    /**
     * @param {Branch}
     * @param {Commit}
     * @return {Commit}
     */
    getCommitBeforeSpecificCommit( branch, commit ) {
        let cur = branch.curCommit;
        let branchStemCommit;
        while (cur.prev.id !== commit.id || cur === null) { 
            cur = cur.prev; 
        }
        branchStemCommit = cur;

        return branchStemCommit;
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
        if (this.head.id === cur.id) {
            b += ', HEAD';
        }
        let mergeCommitSym = cur.isMergeCommit ? '(M)' : '';
        console.log('id=%s | msg=%s | next=%s | prev=%s | bCommits[%s] %s %s', cur.id, cur.message, cur.next?.message, cur.prev?.message, cur.branchCommits.map(c=>c.message).join(','), b ? ' <---('+ b +') branch':'', mergeCommitSym);
        this.displayCommits(cur.next);
        
        for(var i=0; i<cur.branchCommits.length; i++) {
            this.displayCommits(cur.branchCommits[i]);
        }
    }

    warnMsg( msg ) {
        return `<span class="warn">${msg}</span>`;
    }
    errorMsg( msg ) {
        return `<span class="error">${msg}</span>`;
    }
}
