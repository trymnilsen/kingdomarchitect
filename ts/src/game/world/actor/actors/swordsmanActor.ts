import { sprites } from "../../../../asset/sprite";
import {
    SpriteAnimation,
    spriteFromAnimation,
} from "../../../../asset/spriteAnimation";
import { Direction } from "../../../../common/direction";
import { addPoint, Point, getDirection } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { Actor } from "../actor";

export class SwordsmanActor extends Actor {
    private _previousTickPosition: Point;
    private _leftDirectionAnimation: SpriteAnimation;
    private _rightDirectionAnimation: SpriteAnimation;
    private _upDirectionAnimation: SpriteAnimation;
    private _downDirectionAnimation: SpriteAnimation;
    private _direction: Direction;
    private _animationFrame: number = 0;
    constructor(initialPoint: Point) {
        super(initialPoint, sprites.swordsman);
        this._previousTickPosition = initialPoint;
        this._direction = Direction.Down;
        this._leftDirectionAnimation = {
            asset: "swordsman",
            bounds: {
                x1: 0,
                x2: 32,
                y1: 32 * 3,
                y2: 32 * (3 + 1),
            },
            frames: 5,
        };
        this._rightDirectionAnimation = {
            asset: "swordsman",
            bounds: {
                x1: 0,
                x2: 32,
                y1: 32 * 2,
                y2: 32 * (2 + 1),
            },
            frames: 5,
        };
        this._upDirectionAnimation = {
            asset: "swordsman",
            bounds: {
                x1: 0,
                x2: 32,
                y1: 32 * 1,
                y2: 32 * (1 + 1),
            },
            frames: 5,
        };
        this._downDirectionAnimation = {
            asset: "swordsman",
            bounds: {
                x1: 0,
                x2: 32,
                y1: 32 * 0,
                y2: 32 * (0 + 1),
            },
            frames: 5,
        };
    }

    override onUpdate(tick: number) {
        this._previousTickPosition = {
            x: this.tilePosition.x,
            y: this.tilePosition.y,
        };
        // Update the actor, this runs jobs etc
        super.onUpdate(tick);
        // Based on the new position, set the direction
        const direction = getDirection(
            this._previousTickPosition,
            this.tilePosition
        );

        if (direction !== null) {
            this._direction = direction;
            this._animationFrame += 1;
        } else {
            this._direction = Direction.Down;
        }
    }

    override onDraw(context: RenderContext) {
        const worldspace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );
        const offsetPosition = addPoint(worldspace, { x: 3, y: 3 });
        // Draw the sprite of this actor
        context.drawSprite({
            sprite: spriteFromAnimation(
                this.getSpriteAnimation(),
                this._animationFrame
            ),
            x: offsetPosition.x,
            y: offsetPosition.y,
        });
    }

    private getSpriteAnimation(): SpriteAnimation {
        switch (this._direction) {
            case Direction.Up:
                return this._upDirectionAnimation;
            case Direction.Down:
                return this._downDirectionAnimation;
            case Direction.Left:
                return this._leftDirectionAnimation;
            case Direction.Right:
                return this._rightDirectionAnimation;
        }
    }
}
