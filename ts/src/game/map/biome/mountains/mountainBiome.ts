import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateStones } from "../common/stone.js";
import { generateRandomTrees } from "../common/vegetation.js";

export function createMountainsBiome(biome: BiomeEntry) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    fillWithMountainTiles();
    addCarveouts();
    generateForts(biomeMap);
    connectCarveouts();
    blobbifyMountains();
    generateRandomTrees();
    generateStones();
    generateMines();
    generateConnectionPoints();
    return biomeMap;
}
function fillWithMountainTiles() {
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
