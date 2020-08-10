class Terminal { 
    
    // private - references to DOM elements
    #terminalElem = document.getElementById("terminal");
    #terminalFeedElem = document.getElementById("feed");
    #inputContainerElem = document.getElementById("commandLineContainer");
    #commandLineElem = document.getElementById("commandLineInput");
    #terminalHeader = document.getElementById("terminal-head");

    constructor() {
        this.gitProcessor = new GitCommandProcessor();
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
                     "    git log\t\t\t*logs full commit tree to dev console*\n" +
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