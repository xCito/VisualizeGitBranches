class Terminal { 
    
    // private - references to DOM elements
    terminalElem = document.getElementById("terminal");
    terminalFeedElem = document.getElementById("feed");
    inputContainerElem = document.getElementById("commandLineContainer");
    commandLineElem = document.getElementById("commandLineInput");
    terminalHeader = document.getElementById("terminal-head");
    terminalResizers = document.getElementsByClassName("terminal-resizer");

    constructor() {
        this.gitProcessor = new GitCommandProcessor();
        this.prefix = 'xCito\\home> ';
        this.commandHistory = [""];
        this.historyIndex = 0;

        this.isHeld = false;
        this.isResizing = false;
        this.resizeNSWE;
        this.MIN_WIDTH = 260;
        this.MIN_HEIGHT = 100;

        this.shiftX = 0;
        this.shiftY = 0;

        this.setUpEventListeners();
        this.CHAINED_COMMAND_DELAY = 1000;
    }

    setUpEventListeners() {
        // Input listeners to handle terminal-like features 
        this.commandLineElem.addEventListener('keydown', (e) => this._handleKeyPress(e));
        this.terminalElem.addEventListener('click', () => this._focusOnInputElem());

        // Dragging terminal listeners 
        document.addEventListener('mousemove', e => {
            e.buttons === 1 && this.isHeld ? this._handleMouseDrag(e): false;
            e.buttons === 1 && this.isResizing ? this._handleResizing(e): false;
        });
        document.addEventListener('mouseup', () => {
            this.isHeld = false;
            this.isResizing = false;
            this._saveSizeAndLocation();
        });
        this.terminalHeader.addEventListener('mousedown', e => { 
            this.isHeld = true
            this.shiftX = e.pageX - this.terminalHeader.getBoundingClientRect().left+ 10; 
            this.shiftY = e.pageY - this.terminalHeader.getBoundingClientRect().top + 10; 
        });
        
        this.terminalHeader.addEventListener('mouseup', () => this.isHeld = false);

        // Set terminal location and size
        console.log(localStorage.getItem('t-top'));
        if (localStorage.getItem('t-top') == '') {
            this.terminalElem.style.left = '0px';
            this.terminalElem.style.top = '0px';
            this.center();
        }else {
            this._setSizeAndLocation();
        }
        
        // Resizer terminal listeners
        [...this.terminalResizers].forEach( (elem) => {
            elem.addEventListener('mousedown', e => {
                this.isResizing = true;
                this.resizeNSWE = elem.dataset.compass;
                this.shiftX = e.pageX - this.terminalHeader.getBoundingClientRect().left+ 10; 
                this.shiftY = e.pageY - this.terminalHeader.getBoundingClientRect().top + 10; 
            });
            elem.addEventListener('mouseup', () => this.isResizing = false);
        });
    }
    
    center() {
        this.verticalBottom();
        this.horizontalCenter();
    }
    verticalBottom() {
        let terminalHeight = this.terminalElem.getBoundingClientRect().height;
        this.terminalElem.style.top = (window.innerHeight) - (terminalHeight + 70) + 'px';
    }
    
    horizontalCenter() {
        let terminalWidth = this.terminalElem.getBoundingClientRect().width;
        this.terminalElem.style.left = (window.innerWidth/2) - (terminalWidth/2) + 'px';
    }


    _handleKeyPress(e) {
        if ('Enter' === e.key) {    
            let cmd = this.commandLineElem.value;
            let output;
            
            this._addToFeed(cmd);
            this.cmdToListOfCommands(cmd).forEach( async (command, i) => {
                await setTimeout(() => {
                    if(command == "") {
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
        this.terminalElem.style.left = e.clientX - this.shiftX + 'px';
        this.terminalElem.style.top = e.clientY - this.shiftY + 'px';
    }

    _setSizeAndLocation() {
        const left = localStorage.getItem('t-left');
        const top = localStorage.getItem('t-top');
        const height = localStorage.getItem('t-height');
        const width = localStorage.getItem('t-width');

        // Within width bounds
        if (parseInt(left.slice(0,-2)) > window.innerWidth) {
            this.horizontalCenter();
        } else {
            this.terminalElem.style.left   = left;
        }

        // Within height bounds
        if (parseInt(top.slice(0,-2)) > window.innerHeight) {
            this.verticalBottom();
        } else {
            this.terminalElem.style.top    = top;
        }

        this.terminalElem.style.height = height;
        this.terminalElem.style.width  = width;
    }

    _saveSizeAndLocation() {
        localStorage.setItem('t-left', this.terminalElem.style.left);
        localStorage.setItem('t-top', this.terminalElem.style.top);
        localStorage.setItem('t-height', this.terminalElem.style.height);
        localStorage.setItem('t-width', this.terminalElem.style.width);
    }
    
    _handleResizing(e) {
        e.preventDefault();

        let height = this.terminalElem.style.height;
        let width = this.terminalElem.style.width;
        let isVertical = this.resizeNSWE.includes('N') || this.resizeNSWE.includes('S');
        let isHorizontal = this.resizeNSWE.includes('W') || this.resizeNSWE.includes('E');
        if (!height || !width) {
            let style = window.getComputedStyle(this.terminalElem);
            height = style.height;
            width = style.width;
        }
    

        if (isVertical) {
            let hVal = parseInt(height.slice(0,-2));
            let newHeight;
            if (this.resizeNSWE.includes('N')) {
                newHeight = (hVal - e.movementY);
                this.terminalElem.style.top = (e.clientY - this.shiftY) + 'px';
            } else {
                newHeight = (hVal + e.movementY);
            }

            this.terminalElem.style.height = ((newHeight < this.MIN_HEIGHT) ? this.MIN_HEIGHT : newHeight) + 'px';
        } 

        if (isHorizontal) {
            let wVal = parseInt(width.slice(0,-2));
            let newWidth;
            if (this.resizeNSWE.includes('W')) {
                newWidth = (wVal - e.movementX);
                this.terminalElem.style.left = e.clientX - this.shiftX + 'px';
            } else {
                newWidth = (wVal + e.movementX);
            }

            this.terminalElem.style.width = ((newWidth < this.MIN_WIDTH) ? this.MIN_WIDTH: newWidth) + 'px';
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
        this.commandLineElem.value = this.commandHistory[ this.historyIndex ];
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
        this.terminalFeedElem.innerHTML = '';
        this.terminalFeedElem.appendChild(this.inputContainerElem);
        this.commandLineElem.value = '';
        this.commandLineElem.focus();
    }

    displayHelpOptions() {
        let cmds = [
            {name: 'help', desc: 'shows this menu :)'},
            {name: 'clear', desc: 'clears the terminal'},
            {name: 'git help', desc: 'displays list of commands relating to git'}
        ];
        
        let output = "\n\nTerminal Commands\n" + cmds.map( v => {
            return `  ${v.name.padEnd(20, ' ')}${v.desc}\n`;
        }).join('') + '\n';
                                    
        this._addToFeed(output);
    }

    _focusOnInputElem() {
        this.commandLineElem.focus();   
    }

    _addToFeed( text, addPrefix = true ) {
        let span = document.createElement('span');
        span.classList.add('terminal-feed-entry');
        span.innerHTML = addPrefix ? this.prefix + text : text;
        this.commandLineElem.value = '';

        this.terminalFeedElem.appendChild(span);
        this.terminalFeedElem.appendChild(this.inputContainerElem);
        this.commandLineElem.focus();
    }
}

const terminal = new Terminal();