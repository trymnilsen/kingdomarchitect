import { Direction } from "../../../../../common/direction.js";

// This should be a object instead to handle direction better
export enum SpriteAction {
    Move,
    Attack,
    Idle,
}

export type SpriteActionState = {
    direction: Direction;
    action: SpriteAction;
};
