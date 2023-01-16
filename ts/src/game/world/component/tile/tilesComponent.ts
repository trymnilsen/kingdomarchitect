import { sprites } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { getTileId, TileSize } from "../../tile/tile";
import { EntityComponent } from "../entityComponent";
import { Ground } from "./ground";

export interface GroundTile {
    tileX: number;
    tileY: number;
    hasTree?: number;
}

export class TilesComponent extends EntityComponent implements Ground {
    private tiles: { [id: string]: GroundTile } = {};

    constructor() {
        super();
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                const id = getTileId(x, y);
                this.tiles[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: x == 2 && y == 2 ? 2 : 0,
                };
            }
        }
    }

    getTile(tilePosition: Point): GroundTile | null {
        return this.tiles[getTileId(tilePosition.x, tilePosition.y)] || null;
    }

    getTiles(predicate: (tile: GroundTile) => boolean): GroundTile[] {
        return Object.values(this.tiles).filter(predicate);
    }

    setTile(tile: GroundTile) {
        this.tiles[getTileId(tile.tileX, tile.tileY)] = tile;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        for (const tileId in this.tiles) {
            const tile = this.tiles[tileId];
            context.drawRectangle({
                x: tile.tileX * TileSize,
                y: tile.tileY * TileSize,
                width: TileSize - 2,
                height: TileSize - 2,
                fill: "green",
            });

            if (tile.hasTree && tile.hasTree > 0) {
                let sprite = sprites.tree;
                if (tile.hasTree >= 2.0) {
                    sprite = sprites.tree2;
                }
                if (tile.hasTree >= 3.0) {
                    sprite = sprites.tree3;
                }
                context.drawSprite({
                    sprite: sprite,
                    x: tile.tileX * TileSize + 4,
                    y: tile.tileY * TileSize,
                });
            }
        }
    }
}
