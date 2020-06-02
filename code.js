
// Make this object oriented.
class Terminal { 
    
    // private - references to DOM elements
    #terminalElem = document.getElementById("terminal");
    #terminalFeedElem = document.getElementById("feed");
    #inputContainerElem = document.getElementById("commandLineContainer");
    #commandLineElem = document.getElementById("commandLineInput");

    constructor() {
        this.prefix = 'xCito\\home> ';
        this.setUpEventListeners();
    }

    setUpEventListeners() {
        this.#commandLineElem.addEventListener('keypress', (e) => this._handleEnterKey(e));
        this.#terminalElem.addEventListener('click', () => this._focusOnInputElem());
        console.log('yer');
    }

    _focusOnInputElem() {
        this.#commandLineElem.focus();
    }

    _handleEnterKey(e) {
        if ('Enter' === e.key) {    
            let cmd = this.#commandLineElem.value;
            
            this._addToFeed(cmd);
        }
    }

    _addToFeed(text) {
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