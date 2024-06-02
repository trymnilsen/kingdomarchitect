import { tilesets } from "../../../../../generated/tilesets.js";
import { sprites2 } from "../../../../asset/sprite.js";
import {
    randomEntry,
    shuffleItems,
    weightedRandomEntry,
} from "../../../../common/array.js";
import {
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { WaterComponent } from "../../../component/world/waterComponent.js";
import { Entity } from "../../../entity/entity.js";
import { TilesetVariant } from "../../tileset.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateDesertRuins(biomeMap: BiomeMap) {
    const ruinsCount = weightedRandomEntry(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        [5, 20, 50, 100, 50, 25, 10, 5, 2, 2],
    );
    for (let i = 0; i < ruinsCount; i++) {
        const possibleForPositions = getAllPositionsBoundsFitWithinBounds(
            { x: 32, y: 32 },
            { x: 5, y: 5 },
            (candidate) => biomeMap.isSpotAvailable(candidate),
        );

        if (possibleForPositions.length > 0) {
            const oasisPosition = randomEntry(
                shuffleItems(possibleForPositions),
            );

            const tileset = randomEntry(tilesets.desertRuins.variants);
            biomeMap.setItem({
                name: "desertRuins",
                point: { x: oasisPosition.x1, y: oasisPosition.y1 },
                size: sizeOfBounds(oasisPosition),
                factory: createEntityFactory(tileset),
            });
        }
    }
}

function createEntityFactory(
    tileset: TilesetVariant,
): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        for (const entity of tileset.entities) {
            const position = addPoint(
                biome.worldPosition(item),
                entity.position,
            );
            switch (entity.id) {
                case "cacti":
                    createCactiEntity(position, rootEntity);
                    break;
                case "desertpalm":
                    createDesertPalmEntity(position, rootEntity);
                    break;
                case "doubleRuin":
                    createDoubleRuinEntity(position, rootEntity);
                    break;
                case "singleRuin":
                    createSingleRuinEntity(position, rootEntity);
                    break;
                case "water":
                    createWaterEntity(position, rootEntity);
                    break;
                default:
                    break;
            }
        }
    };
}
function createCactiEntity(position: Point, rootEntity: Entity) {
    const cactiEntity = new Entity(generateId("cacti"));
    cactiEntity.addComponent(
        new SpriteComponent(sprites2.cactus, { x: 2, y: 2 }, { x: 32, y: 32 }),
    );
    cactiEntity.addComponent(new WeightComponent(10));
    cactiEntity.worldPosition = position;
    rootEntity.addChild(cactiEntity);
}
function createDesertPalmEntity(position: Point, rootEntity: Entity) {
    const palmEntity = new Entity(generateId("palm"));
    palmEntity.addComponent(new WeightComponent(10));
    palmEntity.addComponent(
        new SpriteComponent(
            sprites2.coconut_tree,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    palmEntity.worldPosition = position;
    rootEntity.addChild(palmEntity);
}
function createDoubleRuinEntity(position: Point, rootEntity: Entity) {
    const doubleRuinEntity = new Entity(generateId("doubleRuin"));
    doubleRuinEntity.addComponent(
        new SpriteComponent(
            sprites2.desert_ruin_two_floor,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    doubleRuinEntity.addComponent(new WeightComponent(100));
    doubleRuinEntity.worldPosition = position;
    rootEntity.addChild(doubleRuinEntity);
}

function createSingleRuinEntity(position: Point, rootEntity: Entity) {
    const singleRuinEntity = new Entity(generateId("singleRuin"));
    singleRuinEntity.addComponent(
        new SpriteComponent(
            sprites2.desert_ruin_large,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    singleRuinEntity.addComponent(new WeightComponent(100));
    singleRuinEntity.worldPosition = position;
    rootEntity.addChild(singleRuinEntity);
}

function createWaterEntity(position: Point, rootEntity: Entity) {
    const waterEntity = new Entity(generateId("water"));
    waterEntity.addComponent(new WaterComponent());
    waterEntity.addComponent(new WeightComponent(100));
    waterEntity.worldPosition = position;
    rootEntity.addChild(waterEntity);
}
