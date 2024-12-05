import { sprites2 } from "../../asset/sprite.js";
import { zeroPoint } from "../../common/point.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { EcsInitEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { BuildingComponent } from "../ecsComponent/building/buildingComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { TransformComponent } from "../ecsComponent/transformComponent.js";
import { TileComponent, tileId } from "../ecsComponent/world/tileComponent.js";

export function createWorldGenerationSystem(): EcsSystem {
    return createSystem({})
        .onEvent(EcsInitEvent, (_query, _event, world) => {
            generateWorld(world);
        })
        .build();
}

function generateWorld(world: EcsWorldScope) {
    //3x3 tiles
    const tilesEntity = world.createEntity();
    const tileComponent = new TileComponent();
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tileComponent.tiles[tileId(x, y)] = {
                x,
                y,
                type: "forrest",
            };
        }
    }
    world.addComponent(tilesEntity, tileComponent);
    const houseEntity = world.createEntity();
    const farmEntity = world.createEntity();
    const wellEntity = world.createEntity();
    const knightEntity = world.createEntity();
    const buildingComponent = new BuildingComponent(woodenHouse, false);
    const drawableComponent = new DrawableComponent(sprites2.wooden_house);
    const transformComponent = new TransformComponent(zeroPoint());
    world.addComponent(houseEntity, buildingComponent);
    world.addComponent(houseEntity, drawableComponent);
    world.addComponent(houseEntity, transformComponent);
}
