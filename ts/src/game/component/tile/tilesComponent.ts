import { sprites2 } from "../../../asset/sprite.js";
import { Bounds } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { BiomeType, biomes } from "../../map/biome/biome.js";
import { ChunkSize, getChunkId, getChunkPosition } from "../../map/chunk.js";
import { getTileId, TileSize } from "../../map/tile.js";
import { EntityComponent } from "../entityComponent.js";
import { Ground } from "./ground.js";

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

type TileChunk = {
    chunkX: number;
    chunkY: number;
    discovered: Set<string>;
    type: BiomeType;
};

export class TilesComponent extends EntityComponent {
    private chunks = new Map<string, TileChunk>();

    getBounds(): Bounds {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const [id, chunk] of this.chunks) {
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
        const chunkId = this.makeChunkId(tilePosition.x, tilePosition.y);
        const chunk = this.chunks.get(chunkId);
        if (!chunk) {
            return null;
        }

        const tileId = getTileId(tilePosition.x, tilePosition.y);
        return {
            tileX: tilePosition.x,
            tileY: tilePosition.y,
            type: chunk.type,
        };
    }

    discoverTile(tilePosition: Point) {
        const chunkId = this.makeChunkId(tilePosition.x, tilePosition.y);
        const chunk = this.chunks.get(chunkId);

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
        this.chunks.set(chunkId, chunk);
    }

    private makeChunkId(x: number, y: number) {
        const cx = Math.floor(x / 32);
        const cy = Math.floor(y / 32);
        return getTileId(cx, cy);
    }

    override onDraw(
        context: RenderScope,
        _screenPosition: Point,
        visiblityMap: RenderVisibilityMap,
    ): void {
        for (const [chunkId, chunk] of this.chunks) {
            const chunkPosition = {
                x: chunk.chunkX * 32,
                y: chunk.chunkY * 32,
            };
            const screenPosition =
                context.camera.tileSpaceToScreenSpace(chunkPosition);

            const withinTheViewport =
                screenPosition.x + 32 * 40 > 0 &&
                screenPosition.y + 32 * 40 > 0 &&
                screenPosition.x - 40 < context.width &&
                screenPosition.y - 40 < context.height;

            if (!withinTheViewport) {
                continue;
            }

            for (let x = 0; x < 32; x++) {
                const tileX = screenPosition.x + x * 40;
                const xWithin = tileX + 40 > 0 && tileX - 40 < context.width;
                if (!xWithin) {
                    continue;
                }

                for (let y = 0; y < 32; y++) {
                    const tileY = screenPosition.y + y * 40;
                    let visible = true;

                    if (visiblityMap.useVisibility) {
                        if (!chunk.discovered.has(getTileId(x, y))) {
                            continue;
                        }

                        visible = visiblityMap.isVisible(tileX, tileY);
                    }

                    let color = biomes[chunk.type].color;
                    if (!visible) {
                        biomes[chunk.type].tint;
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
        }
    }
}
