function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
export class CommitableInteractionStateChanger {
    get hasOperations() {
        return this.operations.length > 0;
    }
    push(state, onPop) {
        this.operations.push({
            type: "push",
            newState: state,
            onPushCallback: onPop
        });
    }
    replace(state) {
        this.operations.push({
            type: "replace",
            newState: state
        });
    }
    pop(result) {
        this.operations.push({
            type: "pop",
            result: result
        });
    }
    clear() {
        this.operations.push({
            type: "clear"
        });
    }
    apply(history) {
        for (const operation of this.operations){
            console.log("Handling interactionStateOperation:", operation);
            switch(operation.type){
                case "push":
                    history.push(operation.newState, operation.onPushCallback);
                    break;
                case "pop":
                    history.pop(operation.result);
                    break;
                case "replace":
                    history.replace(operation.newState);
                    break;
                case "clear":
                    history.clear();
                    break;
            }
        }
        // Clear the list of pending operations so that we don't re-apply
        // an operation later
        this.operations = [];
    }
    constructor(){
        _define_property(this, "operations", []);
    }
}
