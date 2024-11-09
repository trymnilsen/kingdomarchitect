import { Direction } from "../../../../../common/direction.js";

export enum SpriteAction {
    MoveLeft,
    MoveRight,
    MoveUp,
    MoveDown,
    AttackLeft,
    AttackRight,
    AttackUp,
    AttackDown,
}

export function getAnimationStateFromMovementDirection(
    direction: Direction,
): SpriteAction {
    switch (direction) {
        case Direction.Down:
            return SpriteAction.MoveDown;
        case Direction.Up:
            return SpriteAction.MoveUp;
        case Direction.Left:
            return SpriteAction.MoveLeft;
        case Direction.Right:
            return SpriteAction.MoveRight;
    }
}
