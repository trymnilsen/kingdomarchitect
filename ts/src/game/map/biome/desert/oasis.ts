import { tilesets } from "../../../../../generated/tilesets.js";
import { sprites2 } from "../../../../asset/sprite.js";
import {
    randomEntry,
    shuffleItems,
    weightedRandomEntry,
} from "../../../../common/array.js";
import { sizeOfBounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import {
    addPoint,
    multiplyPoint,
    zeroPoint,
} from "../../../../common/point.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { WaterComponent } from "../../../component/world/waterComponent.js";
import { Entity } from "../../../entity/entity.js";
import { TilesetVariant } from "../../tileset.js";
import { BiomeEntry } from "../biome.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateOasis(
    biomes: BiomeMapCollection,
    biomeMap: BiomeMap,
): BiomeMap {
    const numberOfOasisesToMake = getNumberOfOasises(biomes);
    for (let i = 0; i < numberOfOasisesToMake; i++) {
        const placedBounds = biomeMap.placeTileset(
            tilesets.desert,
            createEntityFactory,
        );
    }

    return biomeMap;
}

function getNumberOfOasises(existingBiomes: BiomeMapCollection): number {
    const alreadyHasDesertBiome = existingBiomes.maps.some(
        (biome) => biome.type == "desert",
    );
    // If there already is a desert biome we allow no oasises
    /*if (alreadyHasDesertBiome) {
        return weightedRandomEntry([1, 1, 2, 3, 4, 5], [10, 10, 2, 2, 2, 2]);
    } else {*/
    return weightedRandomEntry(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        [5, 40, 40, 20, 5, 2, 2, 1, 1, 1],
    );
    //}
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
            switch (entity.id) {
                case "water":
                    const waterEntity = new Entity(generateId("water"));
                    waterEntity.addComponent(new WaterComponent());
                    waterEntity.addComponent(new WeightComponent(100));
                    waterEntity.worldPosition = addPoint(
                        biome.worldPosition(item),
                        entity.position,
                    );
                    rootEntity.addChild(waterEntity);
                    break;
                case "desertpalm":
                    const desertEntity = new Entity(generateId("palm"));
                    desertEntity.addComponent(new WeightComponent(10));
                    desertEntity.addComponent(
                        new SpriteComponent(
                            sprites2.coconut_tree,
                            { x: 2, y: 2 },
                            { x: 32, y: 32 },
                        ),
                    );
                    desertEntity.worldPosition = addPoint(
                        biome.worldPosition(item),
                        entity.position,
                    );
                    rootEntity.addChild(desertEntity);
                    break;
                case "wineruin":
                    const wineruinEntity = new Entity(generateId("ruin"));
                    wineruinEntity.addComponent(new WeightComponent(100));
                    wineruinEntity.addComponent(
                        new SpriteComponent(
                            sprites2.desert_ruin_two_floor_vines,
                            { x: 2, y: 2 },
                            { x: 32, y: 32 },
                        ),
                    );
                    wineruinEntity.worldPosition = addPoint(
                        biome.worldPosition(item),
                        entity.position,
                    );
                    rootEntity.addChild(wineruinEntity);
                    break;
                default:
                    break;
            }
        }
    };
}
