import { InvalidArgumentError } from "../../common/error/invalidArgumentError";
import { InvalidStateError } from "../../common/error/invalidStateError";
import { Point, zeroPoint } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";
import { TileSize } from "./tile";

export abstract class Entity {
    private _world: World | null = null;
    protected _health: number = 0;
    protected _maxHp: number = 100;

    tilePosition: Point = zeroPoint();

    public get x(): number {
        return this.tilePosition.x;
    }

    public get y(): number {
        return this.tilePosition.y;
    }

    public get weight(): number | null {
        return null;
    }

    public get health(): number {
        return this._health;
    }

    public get healthPercentage(): number {
        return this._health / this._maxHp;
    }

    public get maxHealth(): number {
        return this._maxHp;
    }

    public get drawBounds(): Point {
        return {
            x: 1,
            y: 1,
        };
    }

    public set health(value: number) {
        if (value < 0) {
            throw new InvalidArgumentError("Health cannot be less than 0");
        }
        if (value > this._maxHp) {
            throw new InvalidArgumentError("Health cannot be more than max hp");
        }

        this._health = value;
    }

    get world(): World {
        if (!this._world) {
            throw new InvalidStateError(
                "World not set, perhaps it is not added to the world yet?"
            );
        }
        return this._world;
    }

    set world(value: World) {
        this._world = value;
    }

    onDraw(context: RenderContext) {
        const worldSpace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );

        if (this._health > 0 && this._health < this._maxHp) {
            const drawSize = TileSize * this.drawBounds.x;
            const healthbarY = worldSpace.y + drawSize - 16;
            const healthbarWidth = drawSize - 10;
            const healthbarX = worldSpace.x + 4;

            context.drawRectangle({
                x: healthbarX,
                y: healthbarY,
                width: healthbarWidth,
                height: 8,
                fill: "black",
            });

            context.drawRectangle({
                x: healthbarX + 2,
                y: healthbarY + 2,
                width: Math.max(healthbarWidth * this.healthPercentage - 4, 4),
                height: 4,
                fill: "green",
            });
        }
    }
}
