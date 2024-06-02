import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateRandomBuildings } from "../common/buildings.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateSmallMountains } from "../common/mountain.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generatePonds } from "../common/pond.js";
import { generateRandomTrees } from "../common/vegetation.js";
import { generateForrest } from "./forrest.js";
import { generateForrestLake } from "./forrestLake.js";

export function createForrestBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
) {
    const biomeMap = biomes.getBiomeMap(biome);
    generateForrestLake(biomeMap);
    generateSmallMountains();
    generateForrest(biomeMap);
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateRandomTrees(biomeMap);
    generateRandomBuildings();
    generateMines();
    generateConnectionPoints(biomeMap, biomes);
    return biomeMap;
}
