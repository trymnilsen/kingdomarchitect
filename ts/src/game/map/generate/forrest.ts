import { BiomeMap } from "../biome/biomeMap.js";
import { generateForts } from "../biome/common/forts.js";
import { generateSmallMountains } from "../biome/common/mountain.js";
import { generateRandomStones } from "../biome/common/stone.js";
import { generateRandomTrees } from "../biome/common/vegetation.js";
import { generateForrest } from "../biome/forrest/forrest.js";
import { generateForrestLake } from "../biome/forrest/forrestLake.js";

export function generateForrestBiome(biomeMap: BiomeMap) {
    generateForrestLake(biomeMap);
    generateSmallMountains();
    generateForts(biomeMap);
    generateForrest(biomeMap);
    generateRandomTrees(biomeMap, 32, 100);
    generateRandomStones(biomeMap, 4, 16);
}
