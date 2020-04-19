import { GameState } from "../gameState";
import { Action } from "../action/action";
import { interactWithReducer } from "./interaction/interactWithReducer";
import { InputActionData } from "../../../input/inputAction";
import { InputEvent } from "../../../input/input";
import { movePlayerReducer } from "./player/movePlayerReducer";
import { Direction } from "../../../data/direction";
import {
    uiDirectionInputReducer,
    uiActionInputReducer,
} from "./ui/uiInputReducer";

export function inputReducer(gameState: GameState, action: Action<InputEvent>) {
    switch (action.data.action) {
        case InputActionData.UP_PRESS:
            upPressedReducer(gameState);
            break;
        case InputActionData.DOWN_PRESS:
            downPressedReducer(gameState);
            break;
        case InputActionData.LEFT_PRESS:
            leftPressedReducer(gameState);
            break;
        case InputActionData.RIGHT_PRESS:
            rightPressedReducer(gameState);
            break;
        case InputActionData.ACTION_PRESS:
            actionPressedReducer(gameState);
    }
}

export function upPressedReducer(gameState: GameState) {
    if (!gameState.uiOpen()) {
        movePlayerReducer(gameState, Direction.Up);
    } else {
        uiDirectionInputReducer(gameState, Direction.Up);
    }
}
export function downPressedReducer(gameState: GameState) {
    if (!gameState.uiOpen()) {
        movePlayerReducer(gameState, Direction.Down);
    } else {
        uiDirectionInputReducer(gameState, Direction.Down);
    }
}
export function leftPressedReducer(gameState: GameState) {
    if (!gameState.uiOpen()) {
        movePlayerReducer(gameState, Direction.Left);
    } else {
    }
}
export function rightPressedReducer(gameState: GameState) {
    if (!gameState.uiOpen()) {
        movePlayerReducer(gameState, Direction.Right);
    } else {
    }
}
export function actionPressedReducer(gameState: GameState) {
    if (!gameState.uiOpen()) {
        //Action button was pressed while there was no UI active. This means
        //we want to interact with
        interactWithReducer(gameState);
    } else {
        uiActionInputReducer(gameState);
    }
}
