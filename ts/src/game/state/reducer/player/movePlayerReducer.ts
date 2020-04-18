import { GameState } from "../../gameState";
import { Action } from "../../action/action";
import { Direction } from "../../../../data/direction";
import { changeX, changeY } from "../../../../data/point";
import { withinRectangle } from "../../../../data/bounds";

export function movePlayerReducer(
    gameState: GameState,
    action: Action<Direction>
) {
    let newPosition = { x: 0, y: 0 };
    const currentPosition = gameState.playerState.position;
    switch (action.data) {
        case Direction.Left:
            newPosition = changeX(currentPosition, -1);
            break;
        case Direction.Right:
            newPosition = changeX(currentPosition, 1);
            break;
        case Direction.Down:
            newPosition = changeY(currentPosition, 1);
            break;
        case Direction.Up:
            newPosition = changeY(currentPosition, -1);
            break;
    }
    if (withinRectangle(newPosition, 0, 0, 7, 7)) {
        gameState.playerState.position = newPosition;
    }
}
