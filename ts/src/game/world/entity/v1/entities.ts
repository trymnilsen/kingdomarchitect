import { getSizeOfPoints, Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { World } from "../../world";
import { Entity } from "./entity2";
import { MultiTileEntity } from "./multiTileEntity";
import { getTileId } from "../../tile/tile";

export class Entities {
    private world: World;
    private tiles: { [id: string]: Entity } = {};

    constructor(world: World) {
        this.world = world;
    }

    getTile(position: Point): Entity {
        return this.tiles[getTileId(position.x, position.y)];
    }

    getTileById(tileId: string): Entity {
        return this.tiles[tileId];
    }

    add(entity: Entity) {
        const tileId = getTileId(entity.tilePosition.x, entity.tilePosition.y);
        this.tiles[tileId] = entity;
        entity.world = this.world;
    }

    getMultiTile(tileId: string): Entity[] {
        const entityTile = this.tiles[tileId];
        if (!entityTile) {
            return [];
        }

        return this.getTiles(entityTile);
    }

    getSize(entity: Entity): Point {
        const tiles = this.getTiles(entity);
        //Get the bounds of all tiles
        return getSizeOfPoints(tiles);
    }

    onDraw(renderContext: RenderContext) {
        for (const tile of Object.values(this.tiles)) {
            tile.onDraw(renderContext);
        }
    }

    private getTiles(entity: Entity): Entity[] {
        const tiles: Entity[] = [];
        if (entity instanceof MultiTileEntity) {
            if (entity.multiTileSource != null) {
                const hostTile = this.tiles[
                    entity.multiTileSource
                ] as MultiTileEntity;

                if (!!hostTile) {
                    hostTile.connectedTiles?.forEach((connectedTile) => {
                        const tile = this.tiles[connectedTile];
                        if (!!tile) {
                            tiles.push(tile);
                        }
                    });
                }
            } else if (entity.connectedTiles != null) {
                entity.connectedTiles.forEach((connectedTile) => {
                    const tile = this.tiles[connectedTile];
                    if (!!tile) {
                        tiles.push(tile);
                    }
                });
            }
        }

        tiles.push(entity);

        return tiles;
    }
}
