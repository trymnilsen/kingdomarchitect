import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generateSwampBuildings } from "./swampBuildings.js";
import { generateSwampPonds } from "./swampPonds.js";
import {
    generateHangingTrees,
    generateSwampPlants,
} from "./swampVegetation.js";

export function createSwampBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
) {
    const biomeMap = biomes.getBiomeMap(biome);
    generateSwampPlants();
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateSwampPonds(biomeMap);
    generateHangingTrees(biomeMap);
    generateSwampBuildings();
    generateConnectionPoints(biomeMap, biomes);
    return biomeMap;
}
