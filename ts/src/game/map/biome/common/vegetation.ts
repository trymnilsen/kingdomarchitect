import { generateId } from "../../../../common/idGenerator.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";

export function generateRandomTrees(map: BiomeMap) {
    const randomAmount = 64 + Math.floor(Math.random() * 200);
    placeRandomEntity(map, "tree", randomAmount, treeFactory);
}

export function generateRandomBushes() {}

function treeFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: ReadonlyArray<BiomeMap>,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const variant = Math.floor(Math.random() * 3);
    const tree = treePrefab(generateId("tree"), variant);
    tree.worldPosition = position;
    rootEntity.addChild(tree);
}
