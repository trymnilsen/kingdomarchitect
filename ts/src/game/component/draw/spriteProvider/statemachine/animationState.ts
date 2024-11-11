import { Sprite2 } from "../../../../../asset/sprite.js";
import { zeroPoint } from "../../../../../common/point.js";
import { Entity } from "../../../../entity/entity.js";
import { SpriteProviderConfig } from "../spriteProvider.js";

export abstract class AnimationState {
    private _finished: () => void = () => {};

    public get finished(): () => void {
        return this._finished;
    }

    public set finished(v: () => void) {
        this._finished = v;
    }

    abstract get spriteConfiguration(): SpriteProviderConfig;
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
    constructor(
        private sprite: Sprite2,
        private ticksPerFrame: number = 1,
    ) {
        super();
    }

    override onDrawUpdate(drawTick: number): void {
        if (drawTick % this.ticksPerFrame != 0) {
            return;
        }

        const clampedFrame =
            (this._currentFrame + 1) % this.sprite.defintion.frames;
        this._currentFrame = clampedFrame;
    }
}

export class SingleAnimationState extends AnimationState {
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
        const nextFrame = this._currentFrame + 1;
        this._currentFrame = nextFrame % this.sprite.defintion.frames;
        if (nextFrame >= this.sprite.defintion.frames) {
            this.finished();
        }
    }
}
