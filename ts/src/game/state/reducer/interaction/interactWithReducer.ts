import {
    GameState,
    getTileKey,
    STONE_TILE_ITEM_TYPE,
    UiWindowType,
} from "../../gameState";
import { adjacentPoint } from "../../../../data/point";
import { withinRectangle } from "../../../../data/bounds";
import { POP_ACTION } from "../../../ui/uiPresenter";
import { MINE_ACTION } from "../../action/interact";

export function interactWithReducer(gameState: GameState) {
    if (gameState.uiOpen()) {
    } else {
        //Action button was pressed while there was no UI active. This means
        //we want to interact with
        const playerPosition = gameState.playerState.position;
        const playerDirection = gameState.playerState.direction;
        const targetPosition = adjacentPoint(playerPosition, playerDirection);
        if (withinRectangle(targetPosition, 0, 0, 7, 7)) {
            const targetTile = gameState.tiles[getTileKey(targetPosition)];
            if (targetTile.items.some((x) => x.type == STONE_TILE_ITEM_TYPE)) {
                console.log("Interacting with stone, open list for actions");
                gameState.uiState.pushUiList([
                    { action: MINE_ACTION, label: "mine" },
                    { action: "details", label: "details" },
                    { action: POP_ACTION, label: "close" },
                ]);
            }
        }
    }
}
