import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createTileComponent,
    setChunk,
    type TileComponent,
} from "../../../src/game/component/tileComponent.ts";
import {
    createLandTerrain,
    terrainIndex,
} from "../../../src/game/map/chunk.ts";
import { isShoreWater } from "../../../src/game/map/shoreWater.ts";
import { Terrain } from "../../../src/game/map/terrain.ts";

// Chunk (1, 1) covers world tiles 16..31, painted coordinates are chunk-local
function tilesWith(painted: [number, number, Terrain][]): TileComponent {
    const tiles = createTileComponent();
    const terrain = createLandTerrain();
    for (const [x, y, paint] of painted) {
        terrain[terrainIndex(x, y)] = paint;
    }
    setChunk(tiles, { chunkX: 1, chunkY: 1, terrain });
    return tiles;
}

describe("isShoreWater", () => {
    it("accepts water with land on a cardinal side", () => {
        const tiles = tilesWith([[5, 7, Terrain.Water]]);

        assert.strictEqual(isShoreWater(tiles, { x: 21, y: 23 }), true);
    });

    it("rejects water whose only land is diagonal", () => {
        // A plus of water around (5,7): the corners are land, the sides are not
        const tiles = tilesWith([
            [5, 7, Terrain.Water],
            [4, 7, Terrain.Water],
            [6, 7, Terrain.Water],
            [5, 6, Terrain.Water],
            [5, 8, Terrain.Water],
        ]);

        assert.strictEqual(isShoreWater(tiles, { x: 21, y: 23 }), false);
    });

    it("does not count ice as a bank", () => {
        const tiles = tilesWith([
            [5, 7, Terrain.Water],
            [4, 7, Terrain.Ice],
            [6, 7, Terrain.Ice],
            [5, 6, Terrain.Ice],
            [5, 8, Terrain.Ice],
        ]);

        assert.strictEqual(isShoreWater(tiles, { x: 21, y: 23 }), false);
    });

    it("rejects land beside water", () => {
        const tiles = tilesWith([[5, 7, Terrain.Water]]);

        assert.strictEqual(isShoreWater(tiles, { x: 20, y: 23 }), false);
    });
});
