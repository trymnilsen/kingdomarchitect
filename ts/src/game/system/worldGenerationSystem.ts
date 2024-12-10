import { sprites2 } from "../../asset/sprite.js";
import { zeroPoint } from "../../common/point.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { EcsInitEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { BuildingComponent } from "../ecsComponent/building/buildingComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { TileComponent, tileId } from "../ecsComponent/world/tileComponent.js";
import { generateMap } from "../map/mapGenerator.js";

export function createWorldGenerationSystem(): EcsSystem {
    return createSystem({})
        .onEvent(EcsInitEvent, (_query, _event, world) => {
            //generateMap(world);
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

    //House
    const buildingComponent = new BuildingComponent(woodenHouse, false);
    const drawableComponent = new DrawableComponent(sprites2.wooden_house, {
        x: 2,
        y: 2,
    });
    world.addComponent(houseEntity, buildingComponent);
    world.addComponent(houseEntity, drawableComponent);

    //Farm
    const drawableFarmComponent = new DrawableComponent(sprites2.farm_3, {
        x: 2,
        y: 0,
    });
    const transformFarmComponent = new TransformComponent({ x: 1, y: 0 });
    world.addComponent(farmEntity, drawableFarmComponent);
    world.addComponent(farmEntity, transformFarmComponent);

    //Well
    const drawableWellComponent = new DrawableComponent(sprites2.well, {
        x: 2,
        y: 2,
    });
    const transformWellComponent = new TransformComponent({ x: 1, y: 1 });
    world.addComponent(wellEntity, drawableWellComponent);
    world.addComponent(wellEntity, transformWellComponent);

    //knight
    const drawableKnightComponent = new DrawableComponent(sprites2.knight);
    const transformKnightComponent = new TransformComponent({ x: 0, y: 1 });
    world.addComponent(knightEntity, drawableKnightComponent);
    world.addComponent(knightEntity, transformKnightComponent);
}
