import { tilesets } from "../../../../../generated/tilesets.js";
import { randomEntry, shuffleItems } from "../../../../common/array.js";
import {
    getAllPositionsBoundsFitWithinBounds,
    sizeOfBounds,
} from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { addPoint } from "../../../../common/point.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { WaterComponent } from "../../../component/world/waterComponent.js";
import { Entity } from "../../../entity/entity.js";
import { Tileset, TilesetVariant, getLargestSize } from "../../tileset.js";
import { placeTileset } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateForrestLake(map: BiomeMap) {
    const maxBudget = (32 * 32) / 10;
    const tileBudget = Math.floor(Math.random() * maxBudget);
    let usedBudget = 0;
    while (usedBudget < tileBudget) {
        const placedBounds = placeTileset(tilesets.pond, map, lakeFactory);
        if (placedBounds) {
            const size = sizeOfBounds(placedBounds);
            const amount = size.x * size.y;
            usedBudget += amount;
        } else {
            break;
        }
    }
}

function lakeFactory(tilesetVariant: TilesetVariant) {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        for (const entity of tilesetVariant.entities) {
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
                default:
                    break;
            }
        }
    };
}
