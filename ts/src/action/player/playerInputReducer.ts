import { Reducer } from "../reducer";
import { Action } from "../action";
import { JsonNode } from "../../state/jsonNode";
import { InputActionData } from "../../input/inputAction";
import { NodeOperation } from "../../state/jsonOperations";
import { Player } from "../../data/player";
import { addPoint, changeY, changeX } from "../../data/point";

export const playerInputReducer: Reducer<InputActionData> = (action, state) => {
    const ops: NodeOperation[] = [];
    const player = state.get(["world", "player"]).value<Player>();
    let position = {
        x: player.position.x,
        y: player.position.y
    };
    switch (action.data) {
        case InputActionData.ACTION_PRESS:
            console.log("Action press");
            break;
        case InputActionData.BACK_PRESS:
            console.log("Back press");
            break;
        case InputActionData.DOWN_PRESS:
            position = changeY(position, 1);
            break;
        case InputActionData.UP_PRESS:
            position = changeY(position, -1);
            break;
        case InputActionData.LEFT_PRESS:
            position = changeX(position, -1);
            break;
        case InputActionData.RIGHT_PRESS:
            position = changeX(position, 1);
            break;
        default:
            console.log("No implementation for " + action.data);
    }
    //Check if the place to move to is valid
    if (
        !!state.get(["world", "tiles", `x${position.x}y${position.y}`]).value()
    ) {
        ops.push({
            operation: "set",
            path: ["world", "player", "position"],
            data: position
        });
    }
    return ops;
};
