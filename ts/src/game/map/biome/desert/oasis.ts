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
import { randomNumber } from "../../../../common/number.js";
import {
    addPoint,
    multiplyPoint,
    zeroPoint,
} from "../../../../common/point.js";
import { vineRuin } from "../../../../data/building/desert/desert.js";
import { palmResource } from "../../../../data/resource/tree.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { WaterComponent } from "../../../component/world/waterComponent.js";
import { buildingPrefab } from "../../../ecsPrefab/buildingPrefab.js";
import { resourcePrefab } from "../../../ecsPrefab/resourcePrefab.js";
import { waterPrefab } from "../../../ecsPrefab/waterPrefab.js";
import { Entity } from "../../../entity/entity.js";
import { TilesetVariant } from "../../tileset.js";
import { BiomeEntry } from "../biome.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateOasis(biomeMap: BiomeMap): BiomeMap {
    const numberOfOasisesToMake = weightedRandomEntry(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        [5, 40, 40, 20, 5, 2, 2, 1, 1, 1],
    );

    for (let i = 0; i < numberOfOasisesToMake; i++) {
        const possibleOasisPositions = getAllPositionsBoundsFitWithinBounds(
            { x: 32, y: 32 },
            { x: 5, y: 5 },
            (candidate) => biomeMap.isSpotAvailable(candidate),
        );

        if (possibleOasisPositions.length > 0) {
            const oasisPosition = randomEntry(
                shuffleItems(possibleOasisPositions),
            );

            const tileset = randomEntry(tilesets.desert.variants);
            biomeMap.setItem({
                name: "oasis",
                point: { x: oasisPosition.x1, y: oasisPosition.y1 },
                size: sizeOfBounds(oasisPosition),
                factory: createEntityFactory(tileset),
            });
        }
    }

    return biomeMap;
}

function createEntityFactory(
    tileset: TilesetVariant,
): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        world: EcsWorldScope,
    ) => {
        for (const entity of tileset.entities) {
            const point = addPoint(biome.worldPosition(item), entity.position);
            switch (entity.id) {
                case "water":
                    waterPrefab(point, world);
                    break;
                case "desertpalm":
                    resourcePrefab(world, palmResource, point);
                    break;
                case "wineruin":
                    buildingPrefab(world, vineRuin, point);
                    break;
                default:
                    break;
            }
        }
    };
}
