import {
    Bounds,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
} from "../../../../common/bounds.js";
import { Entity } from "../../../entity/entity.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generateDesertRuins } from "./desertRuins.js";
import { generateCactii, generateTumbleweed } from "./desertVegetation.js";
import { generateOasis } from "./oasis.js";

export function createDesertBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
): BiomeMap {
    const biomeMap = biomes.getBiomeMap(biome);
    //Generate Oasises
    generateOasis(biomes, biomeMap);
    generateForts(biomeMap);
    generateDesertRuins(biomeMap);
    generateNonPlayerKingdom();
    generateTumbleweed(biomeMap);
    generateCactii(biomeMap);
    generateConnectionPoints(biomeMap, biomes);
    return biomeMap;
}
