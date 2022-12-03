import { sprites } from "../../asset/sprite";
import { getSizeOfPoints, Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { RenderVisual } from "../../rendering/renderVisual";
import { getTileId, TileSize } from "./tile";

export class Buildings {
    private tiles: { [id: string]: BuildingTile } = {};

    getTile(tileId: string): BuildingTile {
        return this.tiles[tileId];
    }

    getSize(buildingTile: BuildingTile): Point {
        const tiles: BuildingTile[] = [];

        if ("multiTile" in buildingTile) {
            const hostTileId = (buildingTile as MultiTile).multiTile;
            const hostTile = this.getTile(hostTileId) as MultiTileSource;
            if (!!hostTile) {
                hostTile.connectedTile.forEach((connectedTile) => {
                    const tile = this.getTile(connectedTile);
                    if (!!tile) {
                        tiles.push(tile);
                    }
                });
            }
        } else if ("connectedTile" in buildingTile) {
            tiles.push(buildingTile);
            //Add all connected tiles as well
            (buildingTile as MultiTileSource).connectedTile.forEach(
                (connectedTile) => {
                    const tile = this.getTile(connectedTile);
                    if (!!tile) {
                        tiles.push(tile);
                    }
                }
            );
        } else {
            tiles.push(buildingTile);
        }

        //Get the bounds of all tiles
        return getSizeOfPoints(tiles);
    }

    add(building: BuildingTile) {
        const tileId = getTileId(building.x, building.y);
        this.tiles[tileId] = building;
    }

    onDraw(renderContext: RenderContext) {
        for (const tile of Object.values(this.tiles)) {
            const offset = tile.offset || { x: 0, y: 0 };
            if (tile.sprite) {
                renderContext.drawSprite({
                    x: tile.x * TileSize + 2 + offset.x,
                    y: tile.y * TileSize + 2 + offset.y,
                    sprite: sprites[tile.sprite],
                });
            }
            if (tile.visual) {
                tile.visual.onDraw(renderContext);
            }
        }
    }
}

export interface BuildingTile {
    x: number;
    y: number;
    weight?: number;
    offset?: Point;
    visual?: RenderVisual;
    sprite?: keyof typeof sprites;
}

export interface MultiTile extends BuildingTile {
    multiTile: string;
}

export interface MultiTileSource extends BuildingTile {
    connectedTile: string[];
}
