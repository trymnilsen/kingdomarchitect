"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function action(name, data) {
    return {
        name,
        data
    };
}
exports.action = action;
function nameStartsWith(start, array) {
    if (!start) {
        return false;
    }
    if (!Array.isArray(start)) {
        start = [start];
    }
    if (start.length > array.length) {
        return false;
    }
    let potentialMatch = false;
    for (let i = 0; i < start.length; i++) {
        potentialMatch = start[i] === array[i];
        if (!potentialMatch) {
            break;
        }
    }
    return potentialMatch;
}
exports.nameStartsWith = nameStartsWith;
//# sourceMappingURL=action.js.map