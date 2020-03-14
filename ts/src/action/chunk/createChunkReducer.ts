import { Action, action, emptyAction, nameStartsWith } from "../action";
import { Reducer } from "../reducer";
import { getChunk } from "../../game/gameScene/world/chunk";

export const addChunkName = "addChunkName";
export const initChunkName = "initChunkName";
export function addChunckAction() {
    return action(["world", addChunkName], emptyAction);
}

export function initChunkAction() {
    return action(["world", initChunkName], emptyAction);
}

export const chunkReducer: Reducer<{}> = (action, state) => {
    if (nameStartsWith(action.name, ["world", initChunkName])) {
        return initChunkReducer(action, state);
    } else {
        return [];
    }
};
export const addChunkReducer: Reducer<{}> = (action, state) => {
    return [];
};
export const initChunkReducer: Reducer<{}> = (action, state) => {
    return getChunk().map((item) => {
        return {
            operation: "set",
            path: ["world", "tiles", `x${item.x}y${item.y}`],
            data: item
        };
    });
};
