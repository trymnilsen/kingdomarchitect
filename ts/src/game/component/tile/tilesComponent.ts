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

export class TilesComponent extends EntityComponent implements Ground {
    private tileMap: TileMap = {};
    private discoveredTiles: { [id: string]: boolean } = {};
    private _chunkMap: GroundChunkMap = {};

    get chunkMap(): Readonly<Record<string, Readonly<GroundChunk>>> {
        return this._chunkMap;
    }

    constructor() {
        super();
        const tileMap: TileMap = {};
        const tileLayerMap = {};
        const chunkMap: GroundChunkMap = {};
        /*
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                const id = getTileId(x, y);
                tileMap[id] = {
                    tileX: x,
                    tileY: y,
                };

                tileLayerMap[id] = 0;
            }
        }

        chunkMap[getTileId(0, 0)] = {
            chunkX: 0,
            chunkY: 0,
        };*/

        this._chunkMap = chunkMap;
        this.tileMap = tileMap;
        this.discoveredTiles = tileLayerMap;
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

    getAllTiles(): ReadonlyArray<GroundTile> {
        return Object.values(this.tileMap);
    }

    getDiscoveredTiles(): ReadonlyArray<GroundTile> {
        return this.getTiles((tile) => {
            const isDiscovered =
                this.discoveredTiles[getTileId(tile.tileX, tile.tileY)];

            return !!isDiscovered;
        });
    }

    discoverTile(tilePosition: Point) {
        const tileId = getTileId(tilePosition.x, tilePosition.y);
        if (!!this.tileMap[tileId]) {
            this.discoveredTiles[tileId] = true;
        }
    }

    setTile(tile: GroundTile, discovered: boolean = false) {
        const tileId = getTileId(tile.tileX, tile.tileY);
        this.tileMap[tileId] = tile;
        this.discoveredTiles[tileId] = discovered;
        const chunkPosition = getChunkPosition(tile.tileX, tile.tileX);
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        if (!this._chunkMap[chunkId]) {
            this._chunkMap[chunkId] = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y,
            };
        }
    }

    removeTile(x: number, y: number) {
        delete this.tileMap[getTileId(x, y)];
    }

    setChunk(chunk: GroundChunk) {
        this._chunkMap[getTileId(chunk.chunkX, chunk.chunkY)] = chunk;
    }

    override onDraw(
        context: RenderScope,
        _screenPosition: Point,
        visiblityMap: RenderVisibilityMap,
    ): void {
        for (const tileId in this.tileMap) {
            const tile = this.tileMap[tileId];
            if (!visiblityMap.useVisibility || !!this.discoveredTiles[tileId]) {
                const tilePosition = {
                    x: tile.tileX,
                    y: tile.tileY,
                };

                const screenPosition =
                    context.camera.tileSpaceToScreenSpace(tilePosition);

                const withinTheViewport =
                    screenPosition.x + 40 > 0 &&
                    screenPosition.y + 40 > 0 &&
                    screenPosition.x - 40 < context.width &&
                    screenPosition.y - 40 < context.height;

                if (!withinTheViewport) {
                    continue;
                }

                const visibility = visiblityMap.isVisible({
                    x: tile.tileX,
                    y: tile.tileY,
                });
                let color = "green";
                const type = tile.type;
                if (!!type) {
                    if (!visiblityMap.useVisibility || visibility) {
                        color = biomes[type].color;
                    } else {
                        color = biomes[type].tint;
                    }
                }

                if (visibility) {
                    context.drawRectangle({
                        x: tile.tileX * TileSize,
                        y: tile.tileY * TileSize,
                        width: TileSize - 2,
                        height: TileSize - 2,
                        fill: color,
                    });
                } else {
                    context.drawRectangle({
                        x: tile.tileX * TileSize,
                        y: tile.tileY * TileSize,
                        width: TileSize - 2,
                        height: TileSize - 2,
                        fill: color,
                    });
                }
            }
        }
    }
}
