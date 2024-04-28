import { Point } from "../../../../common/point.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateStones } from "../common/stone.js";
import { generateRandomTrees } from "../common/vegetation.js";

export function createMountainsBiome(biome: BiomeEntry) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    const mountainMap: MountainMap = {};
    fillWithMountainTiles(mountainMap);
    //addCarveouts(mountainMap);
    generateForts(biomeMap);
    //connectCarveouts(mountainMap, biomeMap);
    blobbifyMountains();
    generateRandomTrees(biomeMap);
    generateStones();
    generateMines();
    generateConnectionPoints();
    return biomeMap;
}

type MountainMap = { [id: string]: Point };

function fillWithMountainTiles(_mountainMap: MountainMap) {
    //throw new Error("Function not implemented.");
}

function addCarveouts() {
    //throw new Error("Function not implemented.");
}

function connectCarveouts() {
    //throw new Error("Function not implemented.");
}

function blobbifyMountains() {
    //throw new Error("Function not implemented.");
}
