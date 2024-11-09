import { Sprite2 } from "../../../../../asset/sprite.js";
import { Point } from "../../../../../common/point.js";
import { DrawMode } from "../../../../../rendering/drawMode.js";
import { RenderScope } from "../../../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../../../rendering/renderVisibilityMap.js";
import { Entity } from "../../../../entity/entity.js";
import { EntityComponent } from "../../../entityComponent.js";
import { SpriteProvider, SpriteProviderConfig } from "../spriteProvider.js";
import { AnimationState } from "./animationState.js";
import { SpriteAction } from "./spriteAction.js";

export class SpriteStateMachine extends EntityComponent {
    private _currentState: SpriteAction;
    private _currentAnimation: AnimationState;

    public get sprite(): SpriteProviderConfig {
        return this._currentAnimation.spriteConfiguration;
    }

    private _animationFactory: (state: SpriteAction) => AnimationState;
    constructor(
        initialState: SpriteAction,
        animationFactory: (state: SpriteAction) => AnimationState,
    ) {
        super();
        this._currentState = initialState;
        this._animationFactory = animationFactory;
        this._currentAnimation = animationFactory(initialState);
    }

    setState(newState: SpriteAction, restartOnCurrent: boolean = false) {
        if (newState != this._currentState || restartOnCurrent) {
            const newAnimation = this._animationFactory(newState);
            console.log(
                "Setting statemachine state: updated state",
                newState,
                this._currentState,
            );
            this._currentState = newState;
            this._currentAnimation = newAnimation;
        } else {
            console.log(
                "Setting statemachine state: new state was same as current",
                newState,
                this._currentState,
            );
        }
    }
    updateSpriteConfiguration(
        drawTick: number,
        drawMode: DrawMode,
    ): SpriteProviderConfig {
        if (drawMode == DrawMode.Tick) {
            this._currentAnimation.onDrawUpdate(drawTick);
        }

        return this._currentAnimation.spriteConfiguration;
    }
    override onUpdate(tick: number): void {
        this._currentAnimation.onUpdate(tick, this.entity);
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
