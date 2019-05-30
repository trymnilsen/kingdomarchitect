import { Reducer } from "../reducer";
import { Action } from "../action";
import { JsonNode } from "../../state/jsonNode";
import { InputActionData } from "../../input/inputAction";
import { NodeOperation } from "../../state/jsonOperations";
import { Player } from "../../data/player";
import { addPoint, changeY, changeX } from "../../data/point";

export const playerInputReducer: Reducer<InputActionData> = (action, state) => {
    const ops: NodeOperation[] = [];
    const player = state.get("player").value<Player>();
    switch (action.data) {
        case InputActionData.ACTION_PRESS:
            console.log("Action press");
            break;
        case InputActionData.BACK_PRESS:
            console.log("Back press");
            break;
        case InputActionData.DOWN_PRESS:
            player.position = changeY(player.position, 1);
            break;
        case InputActionData.UP_PRESS:
            player.position = changeY(player.position, -1);
            break;
        case InputActionData.LEFT_PRESS:
            player.position = changeX(player.position, -1);
            break;
        case InputActionData.RIGHT_PRESS:
            player.position = changeX(player.position, 1);
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
