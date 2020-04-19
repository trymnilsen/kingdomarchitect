import { GameState, getTileKey } from "../../gameState";
import { Action } from "../../action/action";
import { Direction } from "../../../../data/direction";
import { changeX, changeY, Point } from "../../../../data/point";
import { withinRectangle } from "../../../../data/bounds";

export function movePlayerReducer(gameState: GameState, direction: Direction) {
    let newPosition = { x: 0, y: 0 };
    const currentPosition = gameState.playerState.position;
    switch (direction) {
        case Direction.Left:
            newPosition = changeX(currentPosition, -1);
            gameState.playerState.direction = Direction.Left;
            break;
        case Direction.Right:
            newPosition = changeX(currentPosition, 1);
            gameState.playerState.direction = Direction.Right;
            break;
        case Direction.Down:
            newPosition = changeY(currentPosition, 1);
            gameState.playerState.direction = Direction.Down;
            break;
        case Direction.Up:
            newPosition = changeY(currentPosition, -1);
            gameState.playerState.direction = Direction.Up;
            break;
    }
    if (
        withinRectangle(newPosition, 0, 0, 7, 7) &&
        availableTile(gameState, newPosition)
    ) {
        gameState.playerState.position = newPosition;
    }
}

function availableTile(gameState: GameState, position: Point) {
    const tile = gameState.tiles[getTileKey(position)];
    if (!!tile) {
        return tile.items.every((x) => x.impassable === false);
    } else {
        return false;
    }
}
