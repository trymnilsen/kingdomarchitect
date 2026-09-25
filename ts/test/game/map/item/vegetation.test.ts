import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import {
    ChunkSize,
    createLandTerrain,
    getChunkBounds,
    terrainIndex,
    type TileChunk,
} from "../../../../src/game/map/chunk.ts";
import { generateSpawnPoints } from "../../../../src/game/map/item/vegetation.ts";
import { Terrain } from "../../../../src/game/map/terrain.ts";

const byPosition = (a: Point, b: Point) => a.x - b.x || a.y - b.y;

describe("generateSpawnPoints", () => {
    it("only hands out land, never water or ice", () => {
        const landLocal = [
            { x: 1, y: 6 },
            { x: 6, y: 2 },
            { x: ChunkSize - 1, y: ChunkSize - 1 },
        ];
        const terrain = createLandTerrain();
        for (let y = 0; y < ChunkSize; y++) {
            for (let x = 0; x < ChunkSize; x++) {
                if (y < ChunkSize / 2) {
                    terrain[terrainIndex(x, y)] = Terrain.Water;
                } else {
                    terrain[terrainIndex(x, y)] = Terrain.Ice;
                }
            }
        }
        for (const tile of landLocal) {
            terrain[terrainIndex(tile.x, tile.y)] = Terrain.Land;
        }
        const chunk: TileChunk = { chunkX: -2, chunkY: 3, terrain };

        const points = generateSpawnPoints(
            10,
            chunk,
            getChunkBounds({ x: chunk.chunkX, y: chunk.chunkY }),
            createChunkMapComponent().chunkMap,
        );

        const expected = landLocal.map((tile) => ({
            x: chunk.chunkX * ChunkSize + tile.x,
            y: chunk.chunkY * ChunkSize + tile.y,
        }));
        assert.deepStrictEqual(
            [...points].sort(byPosition),
            expected.sort(byPosition),
        );
    });

    it("stays inside the area it is given", () => {
        const chunk: TileChunk = {
            chunkX: 2,
            chunkY: -1,
            terrain: createLandTerrain(),
        };
        const chunkBounds = getChunkBounds({ x: 2, y: -1 });
        const area = {
            x1: chunkBounds.x1 + 3,
            y1: chunkBounds.y1 + 4,
            x2: chunkBounds.x1 + 5,
            y2: chunkBounds.y1 + 5,
        };

        const points = generateSpawnPoints(
            10,
            chunk,
            area,
            createChunkMapComponent().chunkMap,
        );

        assert.strictEqual(points.length, 6, "every tile of the area is used");
        for (const point of points) {
            assert.ok(
                point.x >= area.x1 &&
                    point.x <= area.x2 &&
                    point.y >= area.y1 &&
                    point.y <= area.y2,
                `${point.x},${point.y} is outside the area`,
            );
        }
    });
});
