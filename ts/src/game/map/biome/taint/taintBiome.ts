import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import {
    generateTaintedDeadTrees,
    generateTaintedTrees,
} from "./tainVegetation.js";
import { generateTaintCrystals } from "./taintCrystals.js";
import { generateTaintPortals } from "./taintPortal.js";

export function createTaintBiome(biome: BiomeEntry) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    generateTaintPortals();
    generateTaintedTrees();
    generateTaintedDeadTrees();
    generateForts(biomeMap);
    generateConnectionPoints();
    generateTaintCrystals();

    return biomeMap;
}
