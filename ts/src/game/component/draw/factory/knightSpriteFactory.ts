import { sprites2 } from "../../../../asset/sprite.js";
import { Direction } from "../../../../common/direction.js";
import {
    AnimationState,
    LoopingAnimationState,
    SingleAnimationState,
} from "../spriteProvider/statemachine/animationState.js";
import {
    SpriteAction,
    SpriteActionState,
} from "../spriteProvider/statemachine/spriteAction.js";

export function knightSpriteFactory(state: SpriteActionState): AnimationState {
    if (state.action == SpriteAction.Move) {
        switch (state.direction) {
            case Direction.Down:
                return new SingleAnimationState(sprites2.knight);
            case Direction.Left:
                return new SingleAnimationState(sprites2.knight_left);
            case Direction.Right:
                return new SingleAnimationState(sprites2.knight_right);
            case Direction.Up:
                return new SingleAnimationState(sprites2.knight_up);
        }
    } else {
        switch (state.direction) {
            case Direction.Down:
                return new LoopingAnimationState(sprites2.knight_idle_down, 8);
            case Direction.Left:
                return new LoopingAnimationState(sprites2.knight_idle_left, 8);
            case Direction.Right:
                return new LoopingAnimationState(sprites2.knight_idle_right, 8);
            case Direction.Up:
                return new LoopingAnimationState(sprites2.knight_idle_up, 8);
        }
    }
}
