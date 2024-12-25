import { BiomeType } from "../biome/biome.js";
import { BiomeMap } from "../biome/biomeMap.js";
import { generateForts } from "../biome/common/forts.js";
import {
    generateCactii,
    generateTumbleweed,
} from "../biome/desert/desertVegetation.js";
import { generateOasis } from "../biome/desert/oasis.js";

export function generateDesertBiome(biomeMap: BiomeMap) {
    generateOasis(biomeMap);
    generateForts(biomeMap);
    /*
    generateDesertRuins(biomeMap);
    generateNonPlayerKingdom();
    */
    generateTumbleweed(biomeMap);
    generateCactii(biomeMap);

    //generateConnectionPoints(biomeMap, biomes);
    //return biomeMap;
}
