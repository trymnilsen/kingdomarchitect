import { sprites2 } from "../../../../asset/sprite.js";
import { generateId } from "../../../../common/idGenerator.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateHangingTrees(
    map: BiomeMap,
    minAmount: number = 64,
    randomMultiplier: number = 200,
) {
    const randomAmount =
        minAmount + Math.floor(Math.random() * randomMultiplier);
    placeRandomEntity(map, "tree", randomAmount, treeFactory);
}
export function generateSwampPlants() {}

export function generateRandomBushes() {}

function treeFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const tumbleweedEntity = new Entity(generateId("swamptree"));
    tumbleweedEntity.addComponent(
        new SpriteComponent(
            sprites2.dead_tree,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    tumbleweedEntity.addComponent(new WeightComponent(10));
    tumbleweedEntity.worldPosition = position;
    rootEntity.addChild(tumbleweedEntity);
}
