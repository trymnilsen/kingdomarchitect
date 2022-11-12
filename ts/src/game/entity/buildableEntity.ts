import { Sprite } from "../../asset/sprite";
import { InvalidArgumentError } from "../../common/error/invalidArgumentError";
import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { Entity } from "./entity";
import { TileSize } from "./tile";

export class BuildableEntity extends Entity {
    private _health: number = 0;
    private _maxHp: number = 100;
    private _isScaffolded: boolean = true;

    private scaffoldSprite: Sprite;
    private scaffoldOffset: Point;
    private _buildingSprite: Sprite;
    private _buildingOffset: Point;

    public get buildingSprite(): Sprite {
        return this._buildingSprite;
    }
    public set buildingSprite(value: Sprite) {
        this._buildingSprite = value;
    }
    public get buildingOffset(): Point {
        return this._buildingOffset;
    }
    public set buildingOffset(value: Point) {
        this._buildingOffset = value;
    }
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

    constructor(
        position: Point,
        scaffoldSprite: Sprite,
        scaffoldOffset: Point,
        buildingSprite: Sprite,
        buildingOffset: Point
    ) {
        super();
        this.tilePosition = position;
        this.scaffoldSprite = scaffoldSprite;
        this.scaffoldOffset = scaffoldOffset;
        this._buildingSprite = buildingSprite;
        this._buildingOffset = buildingOffset;
    }

    build(energy: number): number {
        let consumedEnergy = energy;
        this._health += energy;

        // If the build amount would cause us to go above the maxHp,
        // only consume some of it
        if (this._health >= this._maxHp) {
            const overflowedHp = this._health - this._maxHp;
            this._health = this._maxHp;
            consumedEnergy = energy - overflowedHp;

            // If we reach the max hp and are currently scaffolded we run the
            // onBuildEnded method
            if (this._isScaffolded) {
                this.onBuildEnded();
            }

            this._isScaffolded = false;
        }

        return consumedEnergy;
    }

    protected onBuildEnded() {}

    override onDraw(context: RenderContext): void {
        const worldSpace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );

        const offset = this._isScaffolded
            ? this.scaffoldOffset
            : this._buildingOffset;

        context.drawSprite({
            x: worldSpace.x + offset.x,
            y: worldSpace.y + offset.y,
            sprite: this._isScaffolded
                ? this.scaffoldSprite
                : this._buildingSprite,
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
