import { sprites } from "../../../../asset/sprite";
import { Bounds } from "../../../../common/bounds";
import { adjacentPoints, Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { getTileId, TileSize } from "../../tile/tile";
import { EntityComponent } from "../entityComponent";
import { Ground } from "./ground";
import { TileMapUpdateEvent } from "./tileMapUpdatedEvent";
import { UnlockableArea } from "./unlockableArea";

export interface GroundTile {
    tileX: number;
    tileY: number;
    hasTree?: number;
}

export interface GroundChunk {
    chunkX: number;
    chunkY: number;
}

export class TilesComponent extends EntityComponent implements Ground {
    private tileMap: { [id: string]: GroundTile } = {};
    private chunkMap: { [id: string]: GroundChunk } = {};
    constructor() {
        super();
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                const id = getTileId(x, y);
                this.tileMap[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: x == 2 && y == 2 ? 2 : 0,
                };
            }
        }

        this.chunkMap[getTileId(0, 0)] = {
            chunkX: 0,
            chunkY: 0,
        };
    }

    getBounds(): Bounds {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        return {
            x1: 0,
            y1: 0,
            x2: 2,
            y2: 2,
        };
    }

    getTile(tilePosition: Point): GroundTile | null {
        return this.tileMap[getTileId(tilePosition.x, tilePosition.y)] || null;
    }

    getTiles(predicate: (tile: GroundTile) => boolean): GroundTile[] {
        return Object.values(this.tileMap).filter(predicate);
    }

    setTile(tile: GroundTile) {
        this.tileMap[getTileId(tile.tileX, tile.tileY)] = tile;
    }

    unlockArea(area: UnlockableArea) {
        for (const chunk of area.chunks) {
            this.chunkMap[getTileId(chunk.chunkX, chunk.chunkY)] = chunk;
        }

        for (const tile of area.tiles) {
            this.setTile(tile);
        }
        this.publishEvent(new TileMapUpdateEvent(this));
    }

    getUnlockableArea(): UnlockableArea[] {
        //Loop over all chunks
        //Check for chunks that has an edge/adjacent chunk not in the chunkMap
        //Add chunks not in chunkmap to the array of unlockable areas
        //Should unlockable chunks be cached?
        const unlockableChunks: { [chunkId: string]: GroundChunk } = {};
        for (const key in this.chunkMap) {
            if (!Object.prototype.hasOwnProperty.call(this.chunkMap, key)) {
                continue;
            }

            const chunk = this.chunkMap[key];
            const adjacentChunks = adjacentPoints(
                { x: chunk.chunkX, y: chunk.chunkY },
                false
            );

            for (const adjacent of adjacentChunks) {
                const chunkId = getTileId(adjacent.x, adjacent.y);
                if (!this.chunkMap[chunkId] && !unlockableChunks[chunkId]) {
                    unlockableChunks[chunkId] = {
                        chunkX: adjacent.x,
                        chunkY: adjacent.y,
                    };
                }
            }
        }

        return Object.values(unlockableChunks).map((unlockableChunk) => {
            const tiles: GroundTile[] = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    tiles.push({
                        tileX: unlockableChunk.chunkX * 3 + x,
                        tileY: unlockableChunk.chunkY * 3 + y,
                        hasTree: hasTree(0.5),
                    });
                }
            }

            return {
                chunks: [unlockableChunk],
                bounds: {
                    x1: unlockableChunk.chunkX * 3,
                    y1: unlockableChunk.chunkY * 3,
                    x2: (unlockableChunk.chunkX + 1) * 3,
                    y2: (unlockableChunk.chunkY + 1) * 3,
                },
                name: "",
                tiles: tiles,
            };
        });
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        for (const tileId in this.tileMap) {
            const tile = this.tileMap[tileId];
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

function hasTree(threshold: number): number {
    if (Math.random() > threshold) {
        return Math.floor(Math.random() * 3.0) + 1;
    } else {
        return 0;
    }
}
