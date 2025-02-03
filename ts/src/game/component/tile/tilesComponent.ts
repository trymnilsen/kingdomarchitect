import { sprites2 } from "../../../asset/sprite.js";
import { Bounds } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { BiomeType, biomes } from "../../map/biome/biome.js";
import {
    ChunkDimension,
    ChunkSize,
    getChunkId,
    getChunkPosition,
} from "../../map/chunk.js";
import { getTileId, TileSize } from "../../map/tile.js";
import { EntityComponent } from "../entityComponent.js";
import { Ground } from "./ground.js";
import { Volume } from "./volume.js";

export type GroundTile = {
    tileX: number;
    tileY: number;
    type?: BiomeType;
};

export type GroundChunk = {
    chunkX: number;
    chunkY: number;
};

type TilesBundle = {
    tileMap: Record<string, GroundTile>;
    chunkMap: Record<string, GroundChunk>;
    discoveredTiles: Record<string, boolean>;
};

type TileMap = Record<string, GroundTile>;
type GroundChunkMap = Record<string, GroundChunk>;

export type TileChunk = {
    chunkX: number;
    chunkY: number;
    volume: Volume;
    discovered: Set<string>;
};

export class TilesComponent extends EntityComponent {
    private _chunks = new Map<string, TileChunk>();

    public get chunks(): Iterable<Readonly<TileChunk>> {
        return this._chunks.values();
    }

    public get numberOfChunks(): number {
        return this._chunks.size;
    }

    hasChunk(position: Point): boolean {
        return this._chunks.has(getTileId(position.x, position.y));
    }

    getBounds(): Bounds {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const [id, chunk] of this._chunks) {
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

    getChunk(chunkPosition): TileChunk | null {
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        return this._chunks.get(chunkId) ?? null;
    }

    getTile(tilePosition: Point): GroundTile | null {
        const chunkId = this.makeChunkId(tilePosition.x, tilePosition.y);
        const chunk = this._chunks.get(chunkId);
        if (!chunk) {
            return null;
        }

        const tileId = getTileId(tilePosition.x, tilePosition.y);
        return {
            tileX: tilePosition.x,
            tileY: tilePosition.y,
            type: chunk.volume.type,
        };
    }

    discoverTile(tilePosition: Point) {
        const chunkId = this.makeChunkId(tilePosition.x, tilePosition.y);
        const chunk = this._chunks.get(chunkId);

        if (!!chunk) {
            const tileId = getTileId(tilePosition.x, tilePosition.y);
            chunk.discovered.add(tileId);
        }
    }

    /*
    setTile(tile: GroundTile, discovered: boolean = false) {
        const tileId = getTileId(tile.tileX, tile.tileY);
        this.tileMap.set(tileId, tile);
        this.discoveredTiles[tileId] = discovered;
        const chunkPosition = getChunkPosition(tile.tileX, tile.tileX);
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        if (!this._chunkMap[chunkId]) {
            this._chunkMap[chunkId] = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y,
            };
        }
    }*/

    setChunk(chunk: TileChunk) {
        const chunkId = getTileId(chunk.chunkX, chunk.chunkY);
        this._chunks.set(chunkId, chunk);
    }

    private makeChunkId(x: number, y: number) {
        const cx = Math.floor(x / ChunkSize);
        const cy = Math.floor(y / ChunkSize);
        return getTileId(cx, cy);
    }

    override onDraw(
        context: RenderScope,
        _screenPosition: Point,
        visiblityMap: RenderVisibilityMap,
    ): void {
        for (const [chunkId, chunk] of this._chunks) {
            const chunkPosition = {
                x: chunk.chunkX * ChunkSize,
                y: chunk.chunkY * ChunkSize,
            };
            const screenPosition =
                context.camera.tileSpaceToScreenSpace(chunkPosition);

            const withinTheViewport =
                screenPosition.x + ChunkSize * 40 > 0 &&
                screenPosition.y + ChunkSize * 40 > 0 &&
                screenPosition.x - 40 < context.width &&
                screenPosition.y - 40 < context.height;

            if (!withinTheViewport) {
                continue;
            }

            for (let x = 0; x < ChunkSize; x++) {
                const tileX = screenPosition.x + x * 40;
                const xWithin = tileX + 40 > 0 && tileX - 40 < context.width;
                if (!xWithin) {
                    continue;
                }

                for (let y = 0; y < ChunkSize; y++) {
                    const tileY = screenPosition.y + y * 40;
                    let visible = true;

                    if (visiblityMap.useVisibility) {
                        if (!chunk.discovered.has(getTileId(x, y))) {
                            continue;
                        }

                        visible = visiblityMap.isVisible(tileX, tileY);
                    }

                    let color = biomes[chunk.volume.type].color;
                    if (!visible) {
                        biomes[chunk.volume.type].tint;
                    }

                    context.drawScreenSpaceRectangle({
                        x: tileX,
                        y: tileY,
                        width: TileSize - 2,
                        height: TileSize - 2,
                        fill: color,
                    });
                }
            }

            context.drawScreenSpaceRectangle({
                x: screenPosition.x + 16,
                y: screenPosition.y + 16,
                width: ChunkDimension - 32,
                height: ChunkDimension - 32,
                strokeWidth: 2,
                strokeColor: chunk.volume.debugColor,
            });

            context.drawText({
                text: chunk.volume.id,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16,
                color: "black",
                size: 14,
                font: "arial",
            });
            context.drawText({
                text: chunk.volume.debugColor,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 20,
                color: "black",
                size: 14,
                font: "arial",
            });
            context.drawText({
                text: `maxSize: ${chunk.volume.maxSize}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 40,
                color: "black",
                size: 14,
                font: "arial",
            });
            context.drawText({
                text: `size: ${chunk.volume.size}`,
                x: screenPosition.x + 16,
                y: screenPosition.y + 16 + 60,
                color: "black",
                size: 14,
                font: "arial",
            });

            if (visiblityMap.useVisibility) {
                context.drawDottedLine(
                    screenPosition.x + 8,
                    screenPosition.y + 4,
                    screenPosition.x + ChunkDimension - 8,
                    screenPosition.y + 4,
                    biomes.forrest.tint,
                    8,
                );

                context.drawDottedLine(
                    screenPosition.x + ChunkDimension - 4,
                    screenPosition.y + 8,
                    screenPosition.x + ChunkDimension - 4,
                    screenPosition.y + ChunkDimension - 8,
                    biomes.forrest.tint,
                    8,
                );

                context.drawDottedLine(
                    screenPosition.x + 8,
                    screenPosition.y + ChunkDimension - 4,
                    screenPosition.x + ChunkDimension - 8,
                    screenPosition.y + ChunkDimension - 4,
                    biomes.forrest.tint,
                    8,
                );

                context.drawDottedLine(
                    screenPosition.x + 4,
                    screenPosition.y + 8,
                    screenPosition.x + 4,
                    screenPosition.y + ChunkDimension - 8,
                    biomes.forrest.tint,
                    8,
                );
            }
        }
    }
}
