import { tilesets } from "../../../../../generated/tilesets.js";
import { Bounds } from "../../../../common/bounds.js";
import { Point, addPoint } from "../../../../common/point.js";
import { tavern } from "../../../../data/building/food/tavern.js";
import { well } from "../../../../data/building/food/well.js";
import { windmill } from "../../../../data/building/food/windmill.js";
import { gravestone } from "../../../../data/building/gold/gravestone.js";
import { barracks } from "../../../../data/building/stone/barracks.js";
import { stoneWall } from "../../../../data/building/stone/wall.js";
import { woodenHouse } from "../../../../data/building/wood/house.js";
import { farmResource } from "../../../../data/resource/food.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { NpcAreaComponent } from "../../../ecsComponent/actor/npcAreaComponent.js";
import { buildingPrefab } from "../../../ecsPrefab/buildingPrefab.js";
import { resourcePrefab } from "../../../ecsPrefab/resourcePrefab.js";
import { TilesetVariant } from "../../tileset.js";
import { placeTileset } from "../../tilesetPlacer.js";
import { BiomeType } from "../biome.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateForts(biomeMap: BiomeMap) {
    const shouldPlaceForts = true; //Math.random() > getFortWeight(biomeMap.type);
    if (shouldPlaceForts) {
        placeTileset(tilesets.fort, biomeMap, createEntityFactory);
    }
}

function getFortWeight(type: BiomeType): number {
    switch (type) {
        case "forrest":
        case "snow":
        case "plains":
            return 0;
        default:
            return 0;
    }
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
        const itemPosition = biome.worldPosition(item);
        const spawnPoints: Point[] = [];
        for (const entity of tileset.entities) {
            const position = addPoint(itemPosition, entity.position);
            switch (entity.id) {
                case "farm":
                    resourcePrefab(world, farmResource, position);
                    break;
                case "tavern":
                    buildingPrefab(world, tavern, position);
                    break;
                case "well":
                    buildingPrefab(world, well, position);
                    break;
                case "house":
                    buildingPrefab(world, woodenHouse, position);
                    break;
                case "windmill":
                    buildingPrefab(world, windmill, position);
                    break;
                case "barracks":
                    buildingPrefab(world, barracks, position);
                    break;
                case "gravestone":
                    buildingPrefab(world, gravestone, position);
                    break;
                case "wall":
                    buildingPrefab(world, stoneWall, position);
                    break;
                case "spawn":
                    spawnPoints.push(position);
                    break;
                default:
                    break;
            }
        }

        const bounds: Bounds = {
            x1: itemPosition.x,
            y1: itemPosition.y,
            x2: itemPosition.x + item.size.x,
            y2: itemPosition.y + item.size.y,
        };

        const areaEntity = world.createEntity();
        const areaComponent = new NpcAreaComponent();
        areaComponent.bounds = bounds;
        areaComponent.spawnPoints = spawnPoints;
    };
}
