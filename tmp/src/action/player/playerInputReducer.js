"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inputAction_1 = require("../../input/inputAction");
const point_1 = require("../../data/point");
exports.playerInputReducer = (action, state) => {
    const ops = [];
    const player = state.get("player").value();
    switch (action.data) {
        case inputAction_1.InputActionData.ACTION_PRESS:
            console.log("Action press");
            break;
        case inputAction_1.InputActionData.BACK_PRESS:
            console.log("Back press");
            break;
        case inputAction_1.InputActionData.DOWN_PRESS:
            player.position = point_1.changeY(player.position, 1);
            break;
        case inputAction_1.InputActionData.UP_PRESS:
            player.position = point_1.changeY(player.position, -1);
            break;
        case inputAction_1.InputActionData.LEFT_PRESS:
            player.position = point_1.changeX(player.position, -1);
            break;
        case inputAction_1.InputActionData.RIGHT_PRESS:
            player.position = point_1.changeX(player.position, 1);
            break;
        default:
            console.log("No implementation for " + action.data);
    }
    ops.push({
        operation: "set",
        path: ["player", "position"],
        data: player.position
    });
    return ops;
};
//# sourceMappingURL=playerInputReducer.js.map