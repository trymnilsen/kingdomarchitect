import { sprites2 } from "../../../../asset/sprite.js";
import { shuffleItems, weightedRandomEntry } from "../../../../common/array.js";
import { Bounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { Entity } from "../../../entity/entity.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateTumbleweed(map: BiomeMap) {
    const randomAmount = 16 + Math.floor(Math.random() * 32);
    map.placeItems(
        { name: "tumbleweed", factory: tumbleWeedFactory },
        randomAmount,
    );
}

export function generateCactii(biomeMap: BiomeMap) {
    const amount = 16 + Math.floor(Math.random() * 100);
    biomeMap.placeItems(
        { name: "cacti", factory: createEntityFactory },
        amount,
    );
}

function createEntityFactory(): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        const position = biome.worldPosition(item);
        const cactiEntity = new Entity(generateId("cacti"));
        cactiEntity.addComponent(
            new SpriteComponent(
                sprites2.cactus,
                { x: 2, y: 2 },
                { x: 32, y: 32 },
            ),
        );
        cactiEntity.addComponent(new WeightComponent(10));
        cactiEntity.worldPosition = position;
        rootEntity.addChild(cactiEntity);
    };
}

export function generateRandomBushes() {}

function tumbleWeedFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const tumbleweedEntity = new Entity(generateId("tumbleweed"));
    tumbleweedEntity.addComponent(
        new SpriteComponent(
            sprites2.tumbleweed_1,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    tumbleweedEntity.addComponent(new WeightComponent(5));
    tumbleweedEntity.worldPosition = position;
    rootEntity.addChild(tumbleweedEntity);
}
