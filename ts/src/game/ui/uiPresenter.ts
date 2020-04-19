import { GameState, UiWindowType, UiList } from "../state/gameState";
import { RenderNode, container } from "../rendering/items/renderNode";
import { uiList } from "./uiList";
import { RectangleConfiguration } from "../rendering/items/rectangle";

export const POP_ACTION = "pop_window";

export function getUi(gameState: GameState): RenderNode {
    const uiContainer = container();
    for (let i = 0; i < gameState.uiState.windows.length; i++) {
        const element = gameState.uiState.windows[i];
        switch (element.type) {
            case UiWindowType.List:
                uiContainer.children.push(renderUiList(element));
        }
    }
    return uiContainer;
}

export function renderUiList(list: UiList): RenderNode {
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
