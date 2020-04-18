import { rootReducer } from "./reducer/rootReducer";
import { Action } from "./action/action";
import { GameState } from "./gameState";

export class Dispatcher {
    private _onAction: () => void;
    private _gameState: GameState;
    constructor(gameState: GameState, onAction: () => void) {
        this._onAction = onAction;
        this._gameState = gameState;
    }

    public dispatch(action: Action) {
        console.log("Dispatching event: ", action);
        if (!action.name) {
            throw new Error("Action needs to have a name");
        }
        rootReducer(this._gameState, action);
        this._onAction();
    }
}
