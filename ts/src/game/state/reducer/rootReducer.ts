import { GameState } from "../gameState";
import { Action } from "../action/action";
import { movePlayerReducer } from "./player/movePlayerReducer";

export function rootReducer(gameState: GameState, action: Action) {
    if (action.name.startsWith("player")) {
        movePlayerReducer(gameState, action);
    }
}
