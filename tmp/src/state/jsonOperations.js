"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function applyOperations(operations, state) {
    if (!Array.isArray(operations)) {
        operations = [operations];
    }
    operations.forEach((op) => {
        switch (op.operation) {
            case "add":
                state.get(op.path).push(op.data);
                break;
            case "set":
                state.get(op.path).set(op.data);
                break;
            case "remove":
                state.get(op.path).remove();
                break;
            default:
                break;
        }
    });
}
exports.applyOperations = applyOperations;
//# sourceMappingURL=jsonOperations.js.map