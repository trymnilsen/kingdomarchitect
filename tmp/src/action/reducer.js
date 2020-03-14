"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const action_1 = require("./action");
const playerInputReducer_1 = require("./player/playerInputReducer");
exports.rootReducer = (action, state) => {
    if (action_1.nameStartsWith("input", action.name)) {
        if (state.get("focus").value() == "player") {
            return playerInputReducer_1.playerInputReducer(action, state);
        }
    }
    return [];
};
//# sourceMappingURL=reducer.js.map