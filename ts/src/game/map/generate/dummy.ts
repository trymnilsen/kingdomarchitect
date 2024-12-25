import { sprites2 } from "../../../asset/sprite.js";
import { well } from "../../../data/building/food/well.js";
import { woodenHouse } from "../../../data/building/wood/house.js";
import {
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../data/inventory/items/resources.js";
import { EcsWorldScope, RootEntity } from "../../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../../ecs/transformComponent.js";
import { PlayerControllableActorComponent } from "../../ecsComponent/actor/playerControllableActorComponent.js";
import { DrawableComponent } from "../../ecsComponent/drawable/drawableComponent.js";
import { JobComponent } from "../../ecsComponent/job/jobComponent.js";
import { ColliderComponent } from "../../ecsComponent/world/colliderComponent.js";
import {
    TileComponent,
    tileId,
} from "../../ecsComponent/world/tileComponent.js";
import { buildingPrefab } from "../../ecsPrefab/buildingPrefab.js";
import { resourcePrefab } from "../../ecsPrefab/resourcePrefab.js";

function generateDummyWorld(world: EcsWorldScope) {
    //3x3 tiles
    const tileComponent = new TileComponent();
    for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 7; y++) {
            tileComponent.tiles[tileId(x, y)] = {
                x,
                y,
                type: "forrest",
            };
        }
    }
    world.addComponent(RootEntity, tileComponent);
    /*
    const houseEntity = world.createEntity();
    const farmEntity = world.createEntity();
    const knightEntity = world.createEntity();

    //House
    const buildingComponent = new BuildingComponent(woodenHouse, false);
    const transformComponent = new TransformComponent({ x: 3, y: 3 });
    const drawableComponent = new DrawableComponent(sprites2.wooden_house, {
        x: 2,
        y: 2,
    });
    world.addComponent(houseEntity, buildingComponent);
    world.addComponent(houseEntity, drawableComponent);
    world.addComponent(houseEntity, transformComponent);

    //Farm
    const drawableFarmComponent = new DrawableComponent(sprites2.farm_3, {
        x: 2,
        y: 0,
    });
    const transformFarmComponent = new TransformComponent({ x: 4, y: 3 });
    world.addComponent(farmEntity, drawableFarmComponent);
    world.addComponent(farmEntity, transformFarmComponent);

    //Well
    const drawableWellComponent = new DrawableComponent(sprites2.well, {
        x: 2,
        y: 2,
    });
    const transformWellComponent = new TransformComponent({ x: 4, y: 4 });
    world.addComponent(wellEntity, drawableWellComponent);
    world.addComponent(wellEntity, transformWellComponent);
    */

    //const farmEntity = buildingPrefab(world, well);
    const wellEntity = buildingPrefab(world, well, { x: 4, y: 4 });
    const houseEntity = buildingPrefab(world, woodenHouse, { x: 3, y: 3 });
    const farm = resourcePrefab(world, wheatResourceItem, { x: 4, y: 3 });
    const stone = resourcePrefab(world, stoneResource, { x: 1, y: 4 });
    const tree = resourcePrefab(world, woodResourceItem, { x: 4, y: 1 });
    //knight
    const knightEntity = world.createEntity();
    const drawableKnightComponent = new DrawableComponent({
        sprite: sprites2.knight,
    });
    const transformKnightComponent = new TransformComponent({ x: 3, y: 4 });
    const colliderComponent = new ColliderComponent();
    world.addComponent(knightEntity, drawableKnightComponent);
    world.addComponent(knightEntity, transformKnightComponent);
    world.addComponent(knightEntity, colliderComponent);
    world.addComponent(knightEntity, new PlayerControllableActorComponent());
    world.addComponent(knightEntity, new JobComponent());
}
