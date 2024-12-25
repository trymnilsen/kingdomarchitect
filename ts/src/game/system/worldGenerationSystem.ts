import { sprites2 } from "../../asset/sprite.js";
import { randomEntry } from "../../common/array.js";
import { Point, zeroPoint } from "../../common/point.js";
import { well } from "../../data/building/food/well.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import {
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../data/inventory/items/resources.js";
import { createSystem, EcsSystem, EmptyQuery } from "../../ecs/ecsSystem.js";
import { EcsWorldScope, RootEntity } from "../../ecs/ecsWorldScope.js";
import { EcsInitEvent } from "../../ecs/event/ecsInitEvent.js";
import { EcsTransformEvent } from "../../ecs/event/ecsTransformEvent.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { PlayerControllableActorComponent } from "../ecsComponent/actor/playerControllableActorComponent.js";
import { BuildingComponent } from "../ecsComponent/building/buildingComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { JobComponent } from "../ecsComponent/job/jobComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";
import { TileComponent, tileId } from "../ecsComponent/world/tileComponent.js";
import { buildingPrefab } from "../ecsPrefab/buildingPrefab.js";
import { resourcePrefab } from "../ecsPrefab/resourcePrefab.js";
import { BiomeType } from "../map/biome/biome.js";
import { BiomeMap } from "../map/biome/biomeMap.js";
import { randomBiomeType } from "../map/generate/generate.js";
import { inflateBiome } from "../map/generate/inflate.js";
import { generatePlayerStartArea } from "../map/generate/player.js";
import { generateMap } from "../map/mapGenerator.js";

export function createWorldGenerationSystem(): EcsSystem {
    return createSystem(EmptyQuery)
        .onEvent(EcsInitEvent, (_query, _event, world) => {
            //generateMap(world);
            //generateWorld(world);
            createFirstChunk(world);
        })
        .onEvent(EcsTransformEvent, (_query, event, world) => {
            createAdditionalChunk(event.newPosition, world);
        })
        .build();
}

function createFirstChunk(world: EcsWorldScope) {
    const biomeType: BiomeType = randomEntry([
        "desert",
        "forrest",
        "snow",
        "swamp",
    ]);
    const chunkPosition = { x: 0, y: 0 };
    const biomeMap = new BiomeMap(chunkPosition, biomeType);
    generatePlayerStartArea(biomeMap);
    inflateBiome(biomeMap, chunkPosition, world);
}

function createAdditionalChunk(_point: Point, _world: EcsWorldScope) {}
