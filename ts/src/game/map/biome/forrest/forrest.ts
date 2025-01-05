import { tilesets } from "../../../../../generated/tilesets.js";
import { sizeOfBounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { addPoint } from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { TilesetVariant } from "../../tileset.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateForrest(map: BiomeMap) {
    const maxBudget = (32 * 32) / 4;
    const tileBudget = Math.floor(Math.random() * maxBudget) + maxBudget;
    let usedBudget = 0;
    while (usedBudget < tileBudget) {
        const placedBounds = map.placeTileset(tilesets.forrest, treeFactory);
        if (placedBounds) {
            const size = sizeOfBounds(placedBounds);
            const amount = size.x * size.y;
            usedBudget += amount;
        } else {
            break;
        }
    }
}

function treeFactory(tilesetVariant: TilesetVariant) {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        for (const entity of tilesetVariant.entities) {
            switch (entity.id) {
                case "forrest":
                    const treeVariant = Math.floor(Math.random() * 3);
                    const treeEntity = treePrefab(
                        generateId("tree"),
                        treeVariant,
                    );

                    treeEntity.worldPosition = addPoint(
                        biome.worldPosition(item),
                        entity.position,
                    );
                    rootEntity.addChild(treeEntity);
                    break;
                default:
                    break;
            }
        }
    };
}
