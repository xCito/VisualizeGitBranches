class ObservableBranch {

    constructor() {
        this.observerCallbacks = [];
        this.branchState = {
            branch: null,
            type: null
        };
        this.BRANCH_CHANGE_TYPE = {
            NEW: 'NEW',
            DELETE: 'DELETE',
            HEAD: 'HEAD',
            UPDATE: 'UPDATE'
        };
    }

    addObserverCallback(fxn) {
        this.observerCallbacks.push(fxn);
    }
    removeObserverCallback(fxn) {
        this.observerCallbacks = this.observerCallbacks.filter( callback => callback !== fxn );
    }

    setState( branchRef, type ) {
        this.branchState = {
            branch: branchRef,
            type: this.BRANCH_CHANGE_TYPE[type]
        };
        this.notify();
    }

    getState() {
        return this.branchState;
    }

    notify() {
        this.observerCallbacks.forEach( callback => callback() );
    }

}

const observableBranches = new ObservableBranch();