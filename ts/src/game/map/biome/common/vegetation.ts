import { generateId } from "../../../../common/idGenerator.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateRandomTrees(
    map: BiomeMap,
    minAmount: number = 64,
    randomMultiplier: number = 200,
) {
    const randomAmount =
        minAmount + Math.floor(Math.random() * randomMultiplier);
    placeRandomEntity(map, "tree", randomAmount, treeFactory);
}

export function generateRandomBushes() {}

function treeFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    _world: EcsWorldScope,
) {
    throw new Error("Not re-implemented");
    const position = biome.worldPosition(item);
    const variant = Math.floor(Math.random() * 3);
    const tree = treePrefab(generateId("tree"), variant);
    tree.worldPosition = position;
    //rootEntity.addChild(tree);
}
