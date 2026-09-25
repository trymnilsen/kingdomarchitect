import assert from "node:assert";
import { describe, it } from "node:test";
import {
    biomes,
    biomeTerrainColors,
    type BiomeType,
} from "../../../src/game/map/biome.ts";
import {
    biomeTileShades,
    terrainDimColor,
    TileColorVariation,
} from "../../../src/game/map/biomeTileShades.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";
import { Terrain } from "../../../src/game/map/terrain.ts";
import {
    getTileColorVariation,
    tileShadeIndex,
} from "../../../src/game/map/deterministicTileColor.ts";

describe("biomeTileShades", () => {
    it("gives every tile the colour getTileColorVariation computes", () => {
        for (const type of Object.keys(biomes) as BiomeType[]) {
            const fills = Object.values(Terrain).flatMap((terrain) => {
                const colors = biomeTerrainColors(type, terrain);
                const shades = biomeTileShades[type][terrain];
                return [
                    [colors.tint, shades.dark],
                    [terrainDimColor(colors), shades.dim],
                    [colors.color, shades.bright],
                ] as const;
            });
            for (const [baseHex, shades] of fills) {
                for (let y = -40; y < 40; y++) {
                    for (let x = -40; x < 40; x++) {
                        const chunk = {
                            x: Math.floor(x / ChunkSize),
                            y: Math.floor(y / ChunkSize),
                        };
                        const local = {
                            x: x - chunk.x * ChunkSize,
                            y: y - chunk.y * ChunkSize,
                        };
                        assert.strictEqual(
                            shades[tileShadeIndex(x, y, TileColorVariation)],
                            getTileColorVariation(
                                baseHex,
                                chunk,
                                local,
                                TileColorVariation,
                            ),
                            `${type} ${baseHex} at (${x},${y})`,
                        );
                    }
                }
            }
        }
    });
});
