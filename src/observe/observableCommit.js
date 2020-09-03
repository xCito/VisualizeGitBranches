
class ObservableCommit {
    
    
    constructor() {
        this.observerCallbacks = [];
        this.commitState = {
            commit: null,
            branch: null,
            type: null
        };
        this.COMMIT_TYPE = {
            NEW: 0
        };
    }

    addObserverCallback(fxn) {
        this.observerCallbacks.push(fxn);
    }
    removeObserverCallback(fxn) {
        this.observerCallbacks = this.observerCallbacks.filter( callback => callback !== fxn );
    }

    setState( commitRef, branchRef, type ) {
        this.commitState = {
            commit: commitRef,
            branch: branchRef,
            type: this.COMMIT_TYPE[type]
        };
        this.notify();
    }

    getState() {
        return this.commitState;
    }

    notify() {
        this.observerCallbacks.forEach( callback => callback() );
    }

}


const observableCommits = new ObservableCommit();