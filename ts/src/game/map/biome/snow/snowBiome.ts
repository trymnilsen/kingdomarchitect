import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateRandomBuildings } from "../common/buildings.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateSmallMountains } from "../common/mountain.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generateStones } from "../common/stone.js";
import { generateFrozenPonds } from "./frozenPonds.js";
import { generateSnowForrest } from "./snowForrest.js";

export function createSnowBiome(biome: BiomeEntry, biomes: BiomeMapCollection) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    generateSmallMountains();
    generateFrozenPonds();
    generateSnowForrest();
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateRandomBuildings();
    generateMines();
    generateStones();
    generateConnectionPoints(biomeMap, biomes);
    return biomeMap;
}
