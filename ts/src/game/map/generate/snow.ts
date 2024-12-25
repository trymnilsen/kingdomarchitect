import { pineTreeWinterResource } from "../../../data/resource/tree.js";
import { EcsWorldScope } from "../../../ecs/ecsWorldScope.js";
import { resourcePrefab } from "../../ecsPrefab/resourcePrefab.js";
import { BiomeMap, BiomeMapItem } from "../biome/biomeMap.js";
import { BiomeMapCollection } from "../biome/biomeMapCollection.js";
import { generateForts } from "../biome/common/forts.js";
import { placeRandomEntity } from "../tilesetPlacer.js";

export function generateSnowBiome(biomeMap: BiomeMap) {
    generateForts(biomeMap);
    generatePineTrees(biomeMap);
}

function generatePineTrees(
    map: BiomeMap,
    minAmount: number = 64,
    randomMultiplier: number = 200,
) {
    const randomAmount =
        minAmount + Math.floor(Math.random() * randomMultiplier);
    placeRandomEntity(map, "pinetree", randomAmount, treeFactory);
}

function treeFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    world: EcsWorldScope,
) {
    const position = biome.worldPosition(item);
    resourcePrefab(world, pineTreeWinterResource, position);
}
