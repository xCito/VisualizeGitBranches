class Commit {
    constructor(msg) {
        this.message = msg;
        this.prev = null;
        this.next = null;
        this.branchCommits = [];
    }
}

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

class GitCommandProccessor {
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
                case 'branch':
                    response = `${cmd}\n${this.branchCommand(tokens[2])}`;
                    break; 
                case 'commit':
                    response = `${cmd}\n${this.commitCommand(tokens[2], tokens[3])}`;
                    break; 
                case 'merge':
                    response = `${cmd}\n\tMerge things`;
                    break; 
                case 'rebase':
                    response = `${cmd}\n\tRebase things`;
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
            this.branches.push(new Branch(arg, this.curBranch.curCommit));
            resp = `Created branch '${arg}'\n`;
        }

        return resp;
    }

    checkoutCommand(arg) {
        let resp;
        if (arg) {
            let branchExists = this.branches.some( b => b.name === arg); 
            if (branchExists) {
                this.curBranch = this.branches.find( b => b.name === arg);
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
        this.displayCommits(this.rootCommit);
        console.log('\n\n');
        return resp;
    }

    displayCommits(cur) {
        if (cur === null || cur === undefined) {
            return;
        }
    
        console.log(cur.message + "\t| \tprev: " + cur.prev?.message + "\t|\tnext: " + cur.next?.message + "\t|\tbranchoffs: " + cur.branchCommits.map(c=>c.message));
        this.displayCommits(cur.next);
        
        for(var i=0; i<cur.branchCommits.length; i++) {
            this.displayCommits(cur.branchCommits[i]);
        }
    }
}

class Terminal { 
    
    // private - references to DOM elements
    #terminalElem = document.getElementById("terminal");
    #terminalFeedElem = document.getElementById("feed");
    #inputContainerElem = document.getElementById("commandLineContainer");
    #commandLineElem = document.getElementById("commandLineInput");
    #terminalHeader = document.getElementById("terminal-head");

    constructor() {
        this.gitProcessor = new GitCommandProccessor();
        this.prefix = 'xCito\\home> ';
        this.commandHistory = [""];
        this.historyIndex = 0;

        this.isHeld = false;
        this.shiftX = 0;
        this.shiftY = 0;

        this.setUpEventListeners();
    }

    setUpEventListeners() {
        // Input listeners to handle terminal-like features 
        this.#commandLineElem.addEventListener('keydown', (e) => this._handleKeyPress(e));
        this.#terminalElem.addEventListener('click', () => this._focusOnInputElem());

        // Dragging terminal listeners 
        document.addEventListener('mousemove', e => e.buttons === 1 && this.isHeld ? this._handleMouseDrag(e): false);
        this.#terminalHeader.addEventListener('mousedown', e => { 
            this.isHeld = true
            this.shiftX = e.pageX - this.#terminalHeader.getBoundingClientRect().left+ 10; 
            this.shiftY = e.pageY - this.#terminalHeader.getBoundingClientRect().top + 10; 
        });
        this.#terminalHeader.addEventListener('mouseup', () => this.isHeld = false);
        this.#terminalElem.style.left = '0px';
        this.#terminalElem.style.top = '0px';
    }

    _handleKeyPress(e) {
        if ('Enter' === e.key) {    
            let cmd = this.#commandLineElem.value;
            let output;
            
            if(cmd == "") {
                this._addToFeed("");
                return;
            }

            output = this.processCommand(cmd);
            if(output != null) {
                this._addToFeed(output);
            }
            this.historyIndex = 0;
        } else if ('ArrowUp' === e.key) {
            this.navigateCommandHistory(1);
        } else if ('ArrowDown' === e.key) {
            this.navigateCommandHistory(-1);
        }
    }

    _handleMouseDrag(e) {
        e.preventDefault();
        this.#terminalElem.style.left = e.clientX - this.shiftX + 'px';
        this.#terminalElem.style.top = e.clientY - this.shiftY + 'px';
    }

    addToCommandHistory(cmd) {
        this.commandHistory.splice(1,0,cmd);
        if(this.commandHistory.length > 15) {
            this.commandHistory.pop();
        }
    }

    navigateCommandHistory(dir) {
        if(this.commandHistory.length === 0) {
            return;
        }
        this.historyIndex += dir;

        if( this.historyIndex < 0 ) {
            this.historyIndex = 0;
        }
        if( this.historyIndex >= this.commandHistory.length ) {
            this.historyIndex = this.commandHistory.length-1;
        }
        this.#commandLineElem.value = this.commandHistory[ this.historyIndex ];
    }
    
    processCommand(cmd) {
        let msg = null;
        switch(cmd) {
            case 'clear':
                this.clearTerminal();
                break;
            case 'help':
                this.displayHelpOptions();
                break;
            default:
                msg = this.gitProcessor.process(cmd);
                break;
        }
        this.addToCommandHistory(cmd);
        return msg;
    }

    clearTerminal() {
        this.#terminalFeedElem.innerHTML = '';
        this.#terminalFeedElem.appendChild(this.#inputContainerElem);
        this.#commandLineElem.value = '';
        this.#commandLineElem.focus();
    }

    displayHelpOptions() {
        let output = "\n Terminal Commands\n" +
                     "    help\t\t\t*shows this menu*\n" +
                     "    clear\t\t\t*clears the terminal*\n" + 
                     "\n xCitoGit Commands\n" +
                     "    git branch\t\t\t*displays all branches*\n" +
                     "    git branch <branchName>\t*creates a new branch*\n" +
                     "    git checkout <branchName>\t*switches to <branchName>*\n" +
                     "    git commit\t\t\t*logs commit to current branch*\n" +
                     "    git commit -m \"message\"\t*logs commit to current branch with message*\n" +
                     "    git rebase <branchName>\t*noactionyet*\n" +
                     "    git merge <branchName>\t*noactionyet*\n\n";
                     
        this._addToFeed(output);
    }

    _focusOnInputElem() {
        this.#commandLineElem.focus();   
    }

    _addToFeed( text ) {
        let span = document.createElement('span');
        span.classList.add('terminal-feed-entry');
        span.innerText = this.prefix + text;
        this.#commandLineElem.value = '';

        this.#terminalFeedElem.appendChild(span);
        this.#terminalFeedElem.appendChild(this.#inputContainerElem);
        this.#commandLineElem.focus();
    }
}

const terminal = new Terminal();



let root = new Commit('rt');
let master = new Branch('master', root);
master.addNewCommit('c1', false);
master.addNewCommit('c2', false);
master.addNewCommit('c3', false);
master.addNewCommit('c4', false);

let feature = new Branch('feature', master.curCommit);
feature.addNewCommit('f1', true);

let feature2 = new Branch('feature2', feature.curCommit);
feature2.addNewCommit('f2', true);

let cur = root;
// console.log(cur);
// while(cur != null) {
//     console.log(cur.message + "\t| \tprev: " + cur.prev?.message + "\t|\tnext: " + cur.next?.message + "\t|\tbranchoffs: " + cur.branchCommits.map(c=>c.message));
//     cur = cur.next;
// }

function displayCommits(cur, isBranchOff = false) {
    if (cur === null) {
        return;
    }

    console.log(cur.message + "\t| \tprev: " + cur.prev?.message + "\t|\tnext: " + cur.next?.message + "\t|\tbranchoffs: " + cur.branchCommits.map(c=>c.message));
    displayCommits(cur.next);
}
// displayCommits(root);