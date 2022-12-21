import { sprites } from "../../../asset/sprite";
import { Point } from "../../../common/point";
import { RenderContext } from "../../../rendering/renderContext";
import { MultiTileEntity } from "../multiTileEntity";

export class KeepEntity extends MultiTileEntity {
    public override get connectedTiles(): string[] | null {
        return this.tiles;
    }

    public override get drawBounds(): Point {
        return {
            x: 3,
            y: 3,
        };
    }
    constructor(private tiles: string[], point: Point) {
        super();
        this._health = this._maxHp;
        this.tilePosition = point;
    }

    override onDraw(context: RenderContext): void {
        const worldSpace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );
        context.drawSprite({
            sprite: sprites.keep,
            x: worldSpace.x + 10,
            y: worldSpace.y + 10,
        });

        super.onDraw(context);
    }
}

export class KeepChildEntity extends MultiTileEntity {
    public override get multiTileSource(): string | null {
        return this.sourceTileId;
    }

    constructor(private sourceTileId: string, point: Point) {
        super();
        this.tilePosition = point;
    }
}
