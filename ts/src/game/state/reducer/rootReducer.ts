import { GameState } from "../gameState";
import { Action } from "../action/action";
import { movePlayerReducer } from "./player/movePlayerReducer";
import { inputReducer } from "./inputReducer";

export function rootReducer(gameState: GameState, action: Action) {
    if (action.name.startsWith("input")) {
        inputReducer(gameState, action);
    }
}
