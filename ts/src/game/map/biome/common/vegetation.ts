import { generateId } from "../../../../common/idGenerator.js";
import { randomNumber } from "../../../../common/number.js";
import { Resource } from "../../../../data/resource/resource.js";
import {
    tree1Resource,
    tree2Resource,
    tree3Resource,
} from "../../../../data/resource/tree.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { resourcePrefab } from "../../../ecsPrefab/resourcePrefab.js";
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
    world: EcsWorldScope,
) {
    resourcePrefab(
        world,
        randomForrestTreeResource(),
        biome.worldPosition(item),
    );
}

export function randomForrestTreeResource(): Resource {
    const treeVariant = randomNumber(3);
    switch (treeVariant) {
        case 1:
            return tree2Resource;
        case 2:
            return tree3Resource;
        default:
            return tree1Resource;
    }
}
