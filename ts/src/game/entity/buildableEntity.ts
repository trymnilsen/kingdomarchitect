import { Sprite } from "../../asset/sprite";
import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { Entity } from "./entity";

export class BuildableEntity extends Entity {
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

        super.onDraw(context);
    }
}
