let divInput = document.getElementsByClassName('terminal-input')[0];
divInput.addEventListener('keypress', terminalPressEnter);

function terminalInFocus(e) {
    let divTerminal = document.getElementsByClassName('terminal-input')[0];
    divTerminal.focus();
}

function terminalPressEnter(e) {
    console.log(e.key);
    if ('Enter' === e.key) {

        let inputContainer = document.getElementsByClassName('terminal-input-container')[0];
        let divInput = document.getElementsByClassName('terminal-input')[0];
        let divBuffer = document.getElementsByClassName('terminal-buffer')[0];
        let span = document.createElement('span');
        let cmd = 'xCito\\home> ' + divInput.value;
        span.innerText = cmd;

        span.classList.add('terminal-buffer-entry');
        divInput.value = '';
        
        divBuffer.appendChild(span);
        divBuffer.appendChild(inputContainer);
        divInput.focus();
    }
}

class Terminal {}