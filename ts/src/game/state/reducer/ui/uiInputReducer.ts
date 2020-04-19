import { GameState, UiWindowType, UiList } from "../../gameState";
import { Direction } from "../../../../data/direction";
import { MINE_ACTION } from "../../action/interact";

export function uiDirectionInputReducer(
    gameState: GameState,
    direction: Direction
) {
    const windows = gameState.uiState.windows;
    const window = windows[windows.length - 1];
    switch (window.type) {
        case UiWindowType.List:
            uiListDirectionReducer(window, direction);
            break;
    }
}

export function uiActionInputReducer(gameState: GameState) {
    const windows = gameState.uiState.windows;
    const window = windows[windows.length - 1];
    switch (window.type) {
        case UiWindowType.List:
            uiListActionReducer(gameState, window);
            break;
    }
}

export function uiListActionReducer(gameState: GameState, window: UiList) {
    const choosenAction = window.options[window.focusedIndex];
    switch (choosenAction.action) {
        case MINE_ACTION:
            mineStoneReducer(gameState);
    }
    gameState.uiState.pop();
}

export function uiListDirectionReducer(window: UiList, direction: Direction) {
    let newFocusIndex = window.focusedIndex;
    switch (direction) {
        case Direction.Up:
            newFocusIndex--;
            break;
        case Direction.Down:
            newFocusIndex++;
            break;
    }

    if (newFocusIndex >= window.options.length) {
        newFocusIndex = 0;
    } else if (newFocusIndex < 0) {
        newFocusIndex = window.options.length - 1;
    }

    window.focusedIndex = newFocusIndex;
}

export function mineStoneReducer(gameState: GameState) {
    console.log("Mine stone");
    gameState.uiState.pushChatBox([
        "You need a pickaxe to gather stone",
        "You can gather wood, to create one",
    ]);
}
