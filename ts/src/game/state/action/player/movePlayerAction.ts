import { Direction } from "../../../../data/direction";

export const MOVE_PLAYER_ACTION_NAME = "player/move";

export function movePlayerAction(direction: Direction) {
    return {
        name: MOVE_PLAYER_ACTION_NAME,
        data: direction,
    };
}
