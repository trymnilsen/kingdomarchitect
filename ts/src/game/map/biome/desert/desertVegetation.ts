import { sprites2 } from "../../../../asset/sprite.js";
import { shuffleItems, weightedRandomEntry } from "../../../../common/array.js";
import { Bounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import {
    cactiiResource,
    tumbleweedResource,
} from "../../../../data/resource/tree.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { resourcePrefab } from "../../../ecsPrefab/resourcePrefab.js";
import { Entity } from "../../../entity/entity.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateTumbleweed(map: BiomeMap) {
    const randomAmount = 8 + Math.floor(Math.random() * 16);
    placeRandomEntity(map, "tumbleweed", randomAmount, tumbleWeedFactory);
}

export function generateCactii(map: BiomeMap) {
    const randomAmount = 48 + Math.floor(Math.random() * 32);
    placeRandomEntity(map, "cactii", randomAmount, cactiiFactory());
}

function cactiiFactory(): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        world: EcsWorldScope,
    ) => {
        const position = biome.worldPosition(item);
        resourcePrefab(world, cactiiResource, position);
    };
}

export function generateRandomBushes() {}

function tumbleWeedFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    world: EcsWorldScope,
) {
    const position = biome.worldPosition(item);
    resourcePrefab(world, tumbleweedResource, position);
}
