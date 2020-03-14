"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonOperations_1 = require("../state/jsonOperations");
class Dispatcher {
    constructor(rootReducer, state) {
        this.rootReducer = rootReducer;
        this.state = state;
    }
    doAction(action) {
        const operations = this.rootReducer(action, this.state);
        console.log(`Action: ${action.name.join(",")} ops: `, operations);
        jsonOperations_1.applyOperations(operations, this.state);
    }
}
exports.Dispatcher = Dispatcher;
//# sourceMappingURL=dispatcher.js.map