import { tilesets } from "../../../../../generated/tilesets.js";
import { sizeOfBounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { addPoint } from "../../../../common/point.js";
import { WaterComponent } from "../../../component/world/waterComponent.js";
import { Entity } from "../../../entity/entity.js";
import { Tileset, TilesetVariant } from "../../tileset.js";
import { placeTileset } from "../../tilesetPlacer.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateSwampPonds(map: BiomeMap) {
    const maxBudget = 32 * 32;
    const tileBudget =
        maxBudget * 0.5 + Math.floor(Math.random() * maxBudget * 0.5);
    const smallPonds: Tileset = {
        name: tilesets.pond.name,
        variants: tilesets.pond.variants.filter(
            (variant) => variant.width <= 6 && variant.height <= 6,
        ),
    };
    let usedBudget = 0;
    while (usedBudget < tileBudget) {
        const placedBounds = placeTileset(smallPonds, map, lakeFactory);
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
