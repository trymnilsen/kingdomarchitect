import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
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

export function createForrestBiome(biome: BiomeEntry) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    generateForrestLake();
    generateSmallMountains();
    generatePonds();
    generateForrest();
    generateNonPlayerKingdom();
    generateForts(biomeMap);
    generateRandomTrees();
    generateRandomBuildings();
    generateMines();
    generateConnectionPoints();
    return biomeMap;
}
