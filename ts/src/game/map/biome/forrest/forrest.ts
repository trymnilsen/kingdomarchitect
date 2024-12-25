import { tilesets } from "../../../../../generated/tilesets.js";
import { sizeOfBounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { addPoint } from "../../../../common/point.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { resourcePrefab } from "../../../ecsPrefab/resourcePrefab.js";
import { Entity } from "../../../entity/entity.js";
import { treePrefab } from "../../../prefab/treePrefab.js";
import { TilesetVariant } from "../../tileset.js";
import { placeTileset } from "../../tilesetPlacer.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { randomForrestTreeResource } from "../common/vegetation.js";

export function generateForrest(map: BiomeMap) {
    const maxBudget = (32 * 32) / 4;
    const tileBudget = Math.floor(Math.random() * maxBudget) + maxBudget;
    let usedBudget = 0;
    while (usedBudget < tileBudget) {
        const placedBounds = placeTileset(tilesets.forrest, map, treeFactory);
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
        world: EcsWorldScope,
    ) => {
        for (const entity of tilesetVariant.entities) {
            switch (entity.id) {
                case "forrest":
                    const position = addPoint(
                        biome.worldPosition(item),
                        entity.position,
                    );
                    resourcePrefab(
                        world,
                        randomForrestTreeResource(),
                        position,
                    );
                    break;
                default:
                    break;
            }
        }
    };
}
