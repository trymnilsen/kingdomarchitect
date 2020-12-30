import { GameState } from "../state/gameState";
import { RenderNode, container } from "../rendering/items/renderNode";
import { uiList } from "./uiList";
import {
    rectangle,
    RectangleConfiguration,
} from "../rendering/items/rectangle";
import {
    CAMERA_DOWN_HIT_TAG,
    CAMERA_LEFT_HIT_TAG,
    CAMERA_RIGHT_HIT_TAG,
    CAMERA_UP_HIT_TAG,
    TILE_SIZE,
} from "../constants";

export const POP_ACTION = "pop_window";

export function getUi(gameState: GameState): RenderNode {
    const uiContainer = container({
        x: window.innerWidth - 192,
        y: window.innerHeight - 192,
    });
    // Up button
    const upButton = rectangle({
        x: 64,
        y: 0,
        width: 64,
        height: 64,
        fill: "#474747",
        hitTag: CAMERA_UP_HIT_TAG,
    });
    const leftButton = rectangle({
        x: 0,
        y: 64,
        width: 64,
        height: 64,
        fill: "#474747",
        hitTag: CAMERA_LEFT_HIT_TAG,
    });
    const rightButton = rectangle({
        x: 128,
        y: 64,
        width: 64,
        height: 64,
        fill: "#474747",
        hitTag: CAMERA_RIGHT_HIT_TAG,
    });
    const downButton = rectangle({
        x: 64,
        y: 128,
        width: 64,
        height: 64,
        fill: "#474747",
        hitTag: CAMERA_DOWN_HIT_TAG,
    });
    uiContainer.children.push(upButton);
    uiContainer.children.push(leftButton);
    uiContainer.children.push(rightButton);
    uiContainer.children.push(downButton);
    /* for (let i = 0; i < gameState.uiState.windows.length; i++) {
        const element = gameState.uiState.windows[i];
        switch (element.type) {
            case UiWindowType.List:
                uiContainer.children.push(renderUiList(element));
        }
    } */
    return uiContainer;
}

/* export function renderUiList(list: UiList): RenderNode {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const listVisual = uiList(
        list.options.map((option) => option.label),
        list.focusedIndex
    );

    listVisual.config.x = windowWidth - 300 - 32;
    listVisual.config.y = windowHeight - 30 * (list.options.length + 1);
    return listVisual;
}
 */
