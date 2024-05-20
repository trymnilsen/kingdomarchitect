import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateRandomBuildings } from "../common/buildings.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generatePonds } from "../common/pond.js";
import { generateStones } from "../common/stone.js";
import {
    generateRandomBushes,
    generateRandomTrees,
} from "../common/vegetation.js";

export function createPlainsBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    generatePonds();
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateRandomBuildings();
    generateRandomBushes();
    generateRandomTrees(biomeMap, 8, 32);
    generateStones();
    generateConnectionPoints(biomeMap, biomes);
    return biomeMap;
}
