import { Sprite2 } from "../../../../../asset/sprite.js";
import { Direction } from "../../../../../common/direction.js";
import { Point } from "../../../../../common/point.js";
import { DrawMode } from "../../../../../rendering/drawMode.js";
import { RenderScope } from "../../../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../../../rendering/renderVisibilityMap.js";
import { Entity } from "../../../../entity/entity.js";
import { EntityComponent } from "../../../entityComponent.js";
import { SpriteProvider, SpriteProviderConfig } from "../spriteProvider.js";
import { AnimationState } from "./animationState.js";
import { SpriteAction, SpriteActionState } from "./spriteAction.js";

export class SpriteStateMachine extends EntityComponent {
    private _currentState: SpriteActionState;
    private _currentAnimation!: AnimationState;

    public get sprite(): SpriteProviderConfig {
        return this._currentAnimation.spriteConfiguration;
    }

    private _animationFactory: (state: SpriteActionState) => AnimationState;
    //Set default state
    constructor(
        animationFactory: (state: SpriteActionState) => AnimationState,
    ) {
        super();
        this._currentState = {
            direction: Direction.Down,
            action: SpriteAction.Idle,
        };

        this._animationFactory = animationFactory;
        this.setAnimationState(animationFactory(this._currentState));
    }

    setState(newState: SpriteActionState, restartOnCurrent: boolean = false) {
        if (
            !this.stateEqual(newState, this._currentState) ||
            restartOnCurrent
        ) {
            const newAnimation = this._animationFactory(newState);
            this._currentState = newState;
            this.setAnimationState(newAnimation);
        }
    }
    updateSpriteConfiguration(
        drawTick: number,
        drawMode: DrawMode,
    ): SpriteProviderConfig {
        const currentAnimation = this._currentAnimation;
        if (drawMode == DrawMode.Tick) {
            currentAnimation.onDrawUpdate(drawTick);
        }

        return currentAnimation.spriteConfiguration;
    }

    private setAnimationState(state: AnimationState) {
        this._currentAnimation = state;
        state.finished = () => {
            this.setState({
                direction: this._currentState.direction,
                action: SpriteAction.Idle,
            });
        };
    }

    private stateEqual(a: SpriteActionState, b: SpriteActionState): boolean {
        return a.action == b.action && a.direction == b.direction;
    }

    /*
    onUpdate(_updateTick: number, _entity: Entity): void {
        // Run update
    }
    onDraw(
        _drawTick: number,
        _entity: Entity,
        drawMode: DrawMode,
    ): SpriteProviderConfig {
        throw new Error("Not implemented");

        if (drawMode == DrawMode.Tick) {
            // Run draw update
        } else {
            //return this.currentState.sprite;
        }
    }*/
}
