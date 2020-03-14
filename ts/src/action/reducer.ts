import { JsonNode } from "../state/jsonNode";
import { NodeOperation } from "../state/jsonOperations";
import { Action, nameStartsWith } from "./action";
import { playerInputReducer } from "./player/playerInputReducer";
import { DataTree } from "../state/dataNode";
import { chunkReducer } from "./chunk/createChunkReducer";
import { tickReducer } from "./tick/tickReducer";

export type Reducer<T = {}> = (
    action: Action<T>,
    state: DataTree
) => NodeOperation | NodeOperation[];

export const rootReducer: Reducer = (action: Action, state: DataTree) => {
    if (nameStartsWith("input", action.name)) {
        if (state.get("focus").value<string>() == "player") {
            return playerInputReducer(action, state);
        }
    } else if (nameStartsWith("world", action.name)) {
        return chunkReducer(action, state);
    } else if (nameStartsWith("tick", action.name)) {
        return tickReducer(action, state);
    }
    return [];
};
