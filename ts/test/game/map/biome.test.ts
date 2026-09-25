import assert from "node:assert";
import { describe, it } from "node:test";
import { biomes, biomeTerrainColors } from "../../../src/game/map/biome.ts";
import { Terrain, terrainDefinitions } from "../../../src/game/map/terrain.ts";

describe("biomeTerrainColors", () => {
    it("draws land in the biome's ground colours", () => {
        assert.deepStrictEqual(
            biomeTerrainColors("desert", Terrain.Land),
            biomes.desert.ground,
        );
    });

    it("prefers a biome's own colours for a terrain over the default", () => {
        const swampWater = biomeTerrainColors("swamp", Terrain.Water);

        assert.deepStrictEqual(
            swampWater,
            biomes.swamp.terrainColors[Terrain.Water],
        );
        assert.notDeepStrictEqual(
            swampWater,
            terrainDefinitions[Terrain.Water].defaultColors,
        );
    });

    it("falls back to the terrain's default colours", () => {
        assert.deepStrictEqual(
            biomeTerrainColors("mountains", Terrain.Water),
            terrainDefinitions[Terrain.Water].defaultColors,
        );
    });
});
