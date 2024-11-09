import { sprites2 } from "../../../../asset/sprite.js";
import {
    AnimationState,
    LoopingAnimationState,
} from "../spriteProvider/statemachine/animationState.js";
import { SpriteAction } from "../spriteProvider/statemachine/spriteAction.js";

export function knightSpriteFactory(state: SpriteAction): AnimationState {
    let sprite = sprites2.knight;
    switch (state) {
        case SpriteAction.MoveUp:
            sprite = sprites2.knight_up;
            break;
        case SpriteAction.MoveLeft:
            sprite = sprites2.knight_left;
            break;
        case SpriteAction.MoveRight:
            sprite = sprites2.knight_right;
            break;
        default:
            break;
    }
    return new LoopingAnimationState(sprite);
}
