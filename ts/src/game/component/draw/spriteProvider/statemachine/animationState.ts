import { Sprite2 } from "../../../../../asset/sprite.js";
import { zeroPoint } from "../../../../../common/point.js";
import { Entity } from "../../../../entity/entity.js";
import { SpriteProviderConfig } from "../spriteProvider.js";

export abstract class AnimationState {
    abstract get spriteConfiguration(): SpriteProviderConfig;
    abstract onUpdate(tick: number, entity: Entity): void;
    abstract onDrawUpdate(drawTick: number): void;
}

const offset = zeroPoint();
export class LoopingAnimationState extends AnimationState {
    private _currentFrame = 0;
    override get spriteConfiguration(): SpriteProviderConfig {
        return {
            offset: offset,
            sprite: this.sprite,
            frame: this._currentFrame,
        };
    }
    constructor(private sprite: Sprite2) {
        super();
    }

    override onDrawUpdate(_drawTick: number): void {
        const clampedFrame =
            (this._currentFrame + 1) % this.sprite.defintion.frames;
        this._currentFrame = clampedFrame;
    }
    override onUpdate(_tick: number, _entity: Entity): void {}
}
