class GitCommandProccessor {
    constructor() {
        this.branches = ['master', 'develop', 'feature'];
        this.curBranch = 'develop';
    }

    process(cmd) {
        cmd = cmd.replace(/\s+/," ");
        let tokens = cmd.split(/\s/).filter(s => s);
        let response = "";
        console.log(tokens);
        
        if(this.startsWithGit(tokens[0])) {
            response = `${cmd}\n\tThis is custom CitoGit\n\tversion - 1.0.0\n\n`;

            switch(tokens[1]) {
                case undefined:
                    break;
                case 'branch':
                    response = `${cmd}\n${this.branchCommand(tokens[2])}`;
                    break; 
                case 'commit':
                    response = `${cmd}\n\tCommit things`;
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
        console.log(result);
        return result ? true : false;
    }

    branchCommand(arg) {
        let resp;
        if(!arg) {
            console.log('no args, list all branches for response');
            let branchNames = this.branches.reduce((acc,cur,i) => {
                let curBranchSymbol = this.curBranch === cur ? ' * ':' ';
                return `${acc}${i+1})${curBranchSymbol}${cur}\n`;
            }, "");
            resp = `All Branches:\n${branchNames}\n`;
        } else {
            this.branches.push(arg);
            resp = `Created branch '${arg}'\n`;
        }

        return resp;
    }

    checkoutCommand(arg) {
        let resp;
        if (arg) {
            let branchExists = this.branches.includes(arg); 
            if (branchExists) {
                this.curBranch = arg;
                resp = `\tSwitched the '${arg}' branch.\n`;
            } else {
                resp = `Branch name '${arg}' doesnt exist\n`;
            }
        } else {
            resp = `Missing branch name: git checkout <branchName>\n`;
        }

        return resp;
    }
}

class Terminal { 
    
    // private - references to DOM elements
    #terminalElem = document.getElementById("terminal");
    #terminalFeedElem = document.getElementById("feed");
    #inputContainerElem = document.getElementById("commandLineContainer");
    #commandLineElem = document.getElementById("commandLineInput");

    constructor() {
        this.gitProcessor = new GitCommandProccessor();
        this.prefix = 'xCito\\home> ';
        this.setUpEventListeners();
    }

    setUpEventListeners() {
        this.#commandLineElem.addEventListener('keypress', (e) => this._handleEnterKey(e));
        this.#terminalElem.addEventListener('click', () => this._focusOnInputElem());
    }

    _handleEnterKey(e) {
        if ('Enter' === e.key) {    
            let cmd = this.#commandLineElem.value;
            let output = "";

            if(cmd == "") {
                this._addToFeed(output);
                return;
            }


            output = this.processCommand(cmd);
            if(output != null) {
                this._addToFeed(output);
            }
        }
    }
    
    processCommand(cmd) {
        let msg = null;
        switch(cmd) {
            case 'clear':
                this.clearTerminal();
                break;
            default:
                msg = this.gitProcessor.process(cmd);
                break;
        }
        return msg;
    }

    clearTerminal() {
        this.#terminalFeedElem.innerHTML = '';
        this.#terminalFeedElem.appendChild(this.#inputContainerElem);
        this.#commandLineElem.value = '';
        this.#commandLineElem.focus();
    }

    _focusOnInputElem() {
        this.#commandLineElem.focus();   
    }

    _addToFeed( html ) {
        let span = document.createElement('span');
        span.classList.add('terminal-feed-entry');
        span.innerHTML = this.prefix + html;
        this.#commandLineElem.value = '';

        this.#terminalFeedElem.appendChild(span);
        this.#terminalFeedElem.appendChild(this.#inputContainerElem);
        this.#commandLineElem.focus();
    }
}

const terminal = new Terminal();