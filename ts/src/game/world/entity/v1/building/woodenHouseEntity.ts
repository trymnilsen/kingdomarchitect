import { Point } from "../../../../../common/point";
import { BuildingTile } from "../buildings";

export function woodHouseEntity(point: Point): BuildingTile {
    return {
        x: point.x,
        y: point.y,
        sprite: "woodHouse",
    };
}

export function woodHouseScaffold(point: Point): BuildingTile {
    return {
        x: point.x,
        y: point.y,
        sprite: "woodHouseScaffold",
    };
}
/*
class WoodHouseEntity extends Entity {
    private _health: number = 0;
    private _maxHp: number = 100;
    private _isScaffolded: boolean = true;

    public get health(): number {
        return this._health;
    }
    public get healthPercentage(): number {
        return this._health / this._maxHp;
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

    constructor(position: Point) {
        super();
        this.tilePosition = position;
    }

    build(energy: number): number {
        let consumedEnergy = energy;
        this._health += energy;

        // If the build amount would cause us to go above the maxHp,
        // only consume some of it
        if (this._health >= this._maxHp) {
            this._isScaffolded = false;
            const overflowedHp = this._health - this._maxHp;
            this._health = this._maxHp;
            consumedEnergy = energy - overflowedHp;
        }

        return consumedEnergy;
    }

    override onDraw(context: RenderContext): void {
        const worldSpace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );

        context.drawSprite({
            x: worldSpace.x + 2,
            y: worldSpace.y + 2,
            sprite: this._isScaffolded
                ? sprites.woodHouseScaffold
                : sprites.woodHouse,
        });

        if (this._health > 0 && this._health < this._maxHp) {
            const healthbarY = worldSpace.y + TileSize - 16;
            const healthbarWidth = TileSize - 10;
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
*/
