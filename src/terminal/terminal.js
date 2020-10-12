class Terminal { 
    
    // private - references to DOM elements
    #terminalElem = document.getElementById("terminal");
    #terminalFeedElem = document.getElementById("feed");
    #inputContainerElem = document.getElementById("commandLineContainer");
    #commandLineElem = document.getElementById("commandLineInput");
    #terminalHeader = document.getElementById("terminal-head");
    #terminalResizers = document.getElementsByClassName("terminal-resizer");

    constructor() {
        this.gitProcessor = new GitCommandProcessor();
        this.prefix = 'xCito\\home> ';
        this.commandHistory = [""];
        this.historyIndex = 0;

        this.isHeld = false;
        this.isResizing = false;
        this.resizeNSWE;
        this.shiftX = 0;
        this.shiftY = 0;

        this.setUpEventListeners();
        this.CHAINED_COMMAND_DELAY = 1000;
    }

    setUpEventListeners() {
        // Input listeners to handle terminal-like features 
        this.#commandLineElem.addEventListener('keydown', (e) => this._handleKeyPress(e));
        this.#terminalElem.addEventListener('click', () => this._focusOnInputElem());

        // Dragging terminal listeners 
        document.addEventListener('mousemove', e => {
            e.buttons === 1 && this.isHeld ? this._handleMouseDrag(e): false;
            e.buttons === 1 && this.isResizing ? this._handleResizing(e): false;
        });
        document.addEventListener('mouseup', () => {
            this.isHeld = false;
            this.isResizing = false;
        });
        this.#terminalHeader.addEventListener('mousedown', e => { 
            console.log('click');
            this.isHeld = true
            this.shiftX = e.pageX - this.#terminalHeader.getBoundingClientRect().left+ 10; 
            this.shiftY = e.pageY - this.#terminalHeader.getBoundingClientRect().top + 10; 
        });
        
        this.#terminalHeader.addEventListener('mouseup', () => this.isHeld = false);
        this.#terminalElem.style.left = '0px';
        this.#terminalElem.style.top = '0px';
        this.center();
        
        // Resizer terminal listeners
        [...this.#terminalResizers].forEach( (elem) => {
            elem.addEventListener('mousedown', e => {
                this.isResizing = true;
                this.resizeNSWE = elem.dataset.compass;
                this.shiftX = e.pageX - this.#terminalHeader.getBoundingClientRect().left+ 10; 
                this.shiftY = e.pageY - this.#terminalHeader.getBoundingClientRect().top + 10; 
            });
            elem.addEventListener('mouseup', () => this.isResizing = false);
        });
    }
    
    center() {
        let terminalWidth = this.#terminalElem.getBoundingClientRect().width;
        let terminalHeight = this.#terminalElem.getBoundingClientRect().height;
        this.#terminalElem.style.left = (window.innerWidth/2) - (terminalWidth/2) + 'px';
        this.#terminalElem.style.top = (window.innerHeight) - (terminalHeight + 70) + 'px';
    }

    _handleKeyPress(e) {
        if ('Enter' === e.key) {    
            let cmd = this.#commandLineElem.value;
            let output;
            
            this._addToFeed(cmd);
            this.cmdToListOfCommands(cmd).forEach( async (command, i) => {
                await setTimeout(() => {
                    if(command == "") {
                        this._addToFeed("");
                        return;
                    }
                    output = this.processCommand(command);
                    if(output != null) {
                        this._addToFeed(output, false);
                    }
                    this.historyIndex = 0;
                }, this.CHAINED_COMMAND_DELAY * i);
            });
            this.addToCommandHistory(cmd);
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
    
    _handleResizing(e) {
        e.preventDefault();

        let height = this.#terminalElem.style.height;
        let width = this.#terminalElem.style.width;
        let isVertical = this.resizeNSWE.includes('N') || this.resizeNSWE.includes('S');
        let isHorizontal = this.resizeNSWE.includes('W') || this.resizeNSWE.includes('E');
        if (!height || !width) {
            let style = window.getComputedStyle(this.#terminalElem);
            height = style.height;
            width = style.width;
        }
    

        if (isVertical) {
            let hVal = parseInt(height.slice(0,-2));
            if (this.resizeNSWE.includes('N')) {
                this.#terminalElem.style.top = (e.clientY - this.shiftY) + 'px';
                this.#terminalElem.style.height = (hVal - e.movementY) + 'px';
            } else {
                this.#terminalElem.style.height = (hVal + e.movementY) + 'px';
            }
        } 
        if (isHorizontal) {
            let wVal = parseInt(width.slice(0,-2));
            if (this.resizeNSWE.includes('W')) {
                this.#terminalElem.style.width = (wVal - e.movementX) + 'px';
                this.#terminalElem.style.left = e.clientX - this.shiftX + 'px';
            } else {
                this.#terminalElem.style.width = (wVal + e.movementX) + 'px';
            }
        }

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
        return msg;
    }

    cmdToListOfCommands( cmd ) {
        return cmd.split(/\s?&&\s?/g);
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

    _addToFeed( text, addPrefix = true ) {
        let span = document.createElement('span');
        span.classList.add('terminal-feed-entry');
        span.innerHTML = addPrefix ? this.prefix + text : text;
        this.#commandLineElem.value = '';

        this.#terminalFeedElem.appendChild(span);
        this.#terminalFeedElem.appendChild(this.#inputContainerElem);
        this.#commandLineElem.focus();
    }
}

const terminal = new Terminal();