import assert from "node:assert";
import { describe, it } from "node:test";
import type { PondGeneration } from "../../../../src/game/map/biome.ts";
import {
    placeBiomePonds,
    placePonds,
} from "../../../../src/game/map/biome/placePonds.ts";
import {
    ChunkSize,
    createLandTerrain,
    getTerrainInChunk,
    type TileChunk,
} from "../../../../src/game/map/chunk.ts";
import { Terrain } from "../../../../src/game/map/terrain.ts";
import {
    createEmptyMask,
    isMaskSet,
    type TileMask,
} from "../../../../src/game/map/tileMask.ts";
import { seededRandom } from "../../../seededRandom.ts";

const square: TileMask = { width: 3, height: 3, rows: [0b111, 0b111, 0b111] };
const longBar: TileMask = { width: 1, height: 5, rows: [1, 1, 1, 1, 1] };
const alwaysPonds: PondGeneration = {
    terrain: Terrain.Water,
    chance: 1,
    maxCount: 3,
    maxSize: 8,
};

function countTiles(mask: TileMask): number {
    let count = 0;
    for (let y = 0; y < mask.height; y++) {
        for (let x = 0; x < mask.width; x++) {
            if (isMaskSet(mask, x, y)) {
                count++;
            }
        }
    }
    return count;
}

function isInsideHole(x: number, y: number): boolean {
    return x >= 4 && x < 7 && y >= 2 && y < 5;
}

function blockedExceptHole(width: number, height: number): TileMask {
    const rows: number[] = [];
    for (let y = 0; y < ChunkSize; y++) {
        let row = 0;
        for (let x = 0; x < ChunkSize; x++) {
            row = row << 1;
            const inHole = x >= 4 && x < 4 + width && y >= 2 && y < 2 + height;
            if (!inHole) {
                row = row | 1;
            }
        }
        rows.push(row);
    }
    return { width: ChunkSize, height: ChunkSize, rows };
}

function countTerrain(chunk: TileChunk, terrain: Terrain): number {
    return chunk.terrain.filter((tile) => tile === terrain).length;
}

describe("placePonds", () => {
    it("places nothing when the chance roll fails", () => {
        const ponds = placePonds(
            createEmptyMask(ChunkSize, ChunkSize),
            { ...alwaysPonds, chance: 0.25 },
            [square],
            () => 0.25,
        );
        assert.strictEqual(countTiles(ponds), 0);
    });

    it("fits a pond into the only free spot left", () => {
        const ponds = placePonds(
            blockedExceptHole(3, 3),
            alwaysPonds,
            [square],
            seededRandom(7),
        );

        assert.strictEqual(countTiles(ponds), 9);
        for (let y = 0; y < ChunkSize; y++) {
            for (let x = 0; x < ChunkSize; x++) {
                if (isMaskSet(ponds, x, y)) {
                    assert.ok(isInsideHole(x, y), `pond tile at ${x},${y}`);
                }
            }
        }
    });

    it("skips a pond that has no free spot instead of overlapping", () => {
        const ponds = placePonds(
            blockedExceptHole(2, 3),
            alwaysPonds,
            [square],
            seededRandom(7),
        );

        assert.strictEqual(countTiles(ponds), 0);
    });

    it("never picks a shape longer than maxSize, whichever way it is turned", () => {
        const generation = { ...alwaysPonds, maxSize: 4 };
        for (let seed = 1; seed <= 200; seed++) {
            const ponds = placePonds(
                createEmptyMask(ChunkSize, ChunkSize),
                generation,
                [square, longBar],
                seededRandom(seed),
            );
            assert.strictEqual(countTiles(ponds) % 9, 0, `seed ${seed}`);
            assert.ok(countTiles(ponds) >= 9, `seed ${seed}`);
        }
    });
});

describe("placeBiomePonds", () => {
    // zero passes the chance roll and picks the first of everything
    const firstOfEverything = () => 0;

    it("paints the biome's pond terrain onto land", () => {
        const swamp: TileChunk = {
            chunkX: 4,
            chunkY: -3,
            terrain: createLandTerrain(),
        };
        placeBiomePonds("swamp", swamp, firstOfEverything);
        assert.ok(countTerrain(swamp, Terrain.Water) > 0);
        assert.strictEqual(countTerrain(swamp, Terrain.Ice), 0);

        const snow: TileChunk = {
            chunkX: 4,
            chunkY: -3,
            terrain: createLandTerrain(),
        };
        placeBiomePonds("snow", snow, firstOfEverything);
        assert.ok(countTerrain(snow, Terrain.Ice) > 0);
        assert.strictEqual(countTerrain(snow, Terrain.Water), 0);
    });

    it("only turns land into ponds", () => {
        const chunk: TileChunk = {
            chunkX: -2,
            chunkY: 5,
            terrain: createLandTerrain().map((_, index) => {
                const x = index % ChunkSize;
                const y = Math.floor(index / ChunkSize);
                if (isInsideHole(x, y)) {
                    return Terrain.Land;
                }
                return Terrain.Water;
            }),
        };

        placeBiomePonds("snow", chunk, firstOfEverything);

        assert.strictEqual(
            countTerrain(chunk, Terrain.Water),
            ChunkSize * ChunkSize - 9,
        );
        assert.ok(countTerrain(chunk, Terrain.Ice) > 0);
        for (let y = 0; y < ChunkSize; y++) {
            for (let x = 0; x < ChunkSize; x++) {
                if (getTerrainInChunk(chunk, x, y) === Terrain.Ice) {
                    assert.ok(isInsideHole(x, y), `ice at ${x},${y}`);
                }
            }
        }
    });

    it("leaves a biome without ponds all land", () => {
        const chunk: TileChunk = {
            chunkX: 4,
            chunkY: -3,
            terrain: createLandTerrain(),
        };
        placeBiomePonds("plains", chunk, firstOfEverything);

        assert.strictEqual(
            countTerrain(chunk, Terrain.Land),
            ChunkSize * ChunkSize,
        );
    });
});
