import { sprites2 } from "../../../../asset/sprite.js";
import { Bounds } from "../../../../common/bounds.js";
import { Point } from "../../../../common/point.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { ChunkSize } from "../../chunk.js";
import { getTileId, TileSize } from "../../tile/tile.js";
import { EntityComponent } from "../entityComponent.js";
import { Ground } from "./ground.js";

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
    private _chunkMap: { [id: string]: GroundChunk } = {};

    public get chunkMap(): Readonly<{ [id: string]: Readonly<GroundChunk> }> {
        return this._chunkMap;
    }

    constructor() {
        super();
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                const id = getTileId(x, y);
                this.tileMap[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: x == 2 && y == 2 ? 2 : 0,
                };
            }
        }

        this._chunkMap[getTileId(0, 0)] = {
            chunkX: 0,
            chunkY: 0,
        };
    }

    getBounds(): Bounds {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        const chunks = Object.values(this._chunkMap);
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const chunk of chunks) {
            if (chunk.chunkX > maxX) {
                maxX = chunk.chunkX;
            }
            if (chunk.chunkX < minX) {
                minX = chunk.chunkX;
            }
            if (chunk.chunkY > maxY) {
                maxY = chunk.chunkY;
            }
            if (chunk.chunkY < minY) {
                minY = chunk.chunkY;
            }
        }
        return {
            x1: minX * ChunkSize,
            y1: minY * ChunkSize,
            x2: maxX * ChunkSize + ChunkSize - 1,
            y2: maxY * ChunkSize + ChunkSize - 1,
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

    setChunk(chunk: GroundChunk) {
        this._chunkMap[getTileId(chunk.chunkX, chunk.chunkY)] = chunk;
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
                let sprite = sprites2.tree_1;

                if (tile.hasTree >= 2.0) {
                    sprite = sprites2.tree_2;
                }
                if (tile.hasTree >= 3.0) {
                    sprite = sprites2.tree_3;
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
