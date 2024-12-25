import { BiomeMap } from "../biome/biomeMap.js";
import { generateForts } from "../biome/common/forts.js";

export function generateSwampBiome(biomeMap: BiomeMap) {
    generateForts(biomeMap);
}
