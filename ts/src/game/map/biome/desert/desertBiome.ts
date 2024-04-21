import {
    Bounds,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
} from "../../../../common/bounds.js";
import { Entity } from "../../../entity/entity.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateNonPlayerKingdom } from "../common/nonPlayerKingdom.js";
import { generateDesertRuins } from "./desertRuins.js";
import { generateCactii, generateTumbleweed } from "./desertVegetation.js";
import { generateOasis } from "./oasis.js";

export function createDesertBiome(
    existingBiomes: BiomeEntry[],
    _currentBiomeMap: ReadonlyArray<BiomeMap>,
    biome: BiomeEntry,
): BiomeMap {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    //Generate Oasises
    generateOasis(existingBiomes, biomeMap);
    generateForts(biomeMap);
    generateDesertRuins(biomeMap);
    generateCactii(biomeMap);
    generateTumbleweed();
    generateNonPlayerKingdom();
    generateConnectionPoints();
    return biomeMap;
}
