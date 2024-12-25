import { sprites2 } from "../../../asset/sprite.js";
import { randomNumber } from "../../../common/number.js";
import { addPoint, Point } from "../../../common/point.js";
import { well } from "../../../data/building/food/well.js";
import { woodenHouse } from "../../../data/building/wood/house.js";
import { farmResource } from "../../../data/resource/food.js";
import { EcsWorldScope } from "../../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../../ecs/transformComponent.js";
import { PlayerControllableActorComponent } from "../../ecsComponent/actor/playerControllableActorComponent.js";
import { DrawableComponent } from "../../ecsComponent/drawable/drawableComponent.js";
import { JobComponent } from "../../ecsComponent/job/jobComponent.js";
import { ColliderComponent } from "../../ecsComponent/world/colliderComponent.js";
import { buildingPrefab } from "../../ecsPrefab/buildingPrefab.js";
import { resourcePrefab } from "../../ecsPrefab/resourcePrefab.js";
import { BiomeMap, BiomeMapItem } from "../biome/biomeMap.js";
import { BiomeMapCollection } from "../biome/biomeMapCollection.js";

export function generatePlayerStartArea(biomeMap: BiomeMap) {
    const randomPositionX = 2 + randomNumber(32 - 6);
    const randomPositionY = 2 + randomNumber(32 - 6);

    biomeMap.setItem({
        point: {
            x: randomPositionX,
            y: randomPositionY,
        },
        size: {
            x: 4,
            y: 4,
        },
        name: "player",
        factory: (
            item: BiomeMapItem,
            biome: BiomeMap,
            _allBiomes: BiomeMapCollection,
            world: EcsWorldScope,
        ) => {
            const worldPoint = biome.worldPosition(item);
            addPlayerEntities(world, worldPoint);
        },
    });
}

function addPlayerEntities(world: EcsWorldScope, position: Point) {
    const wellEntity = buildingPrefab(
        world,
        well,
        addPoint(position, { x: 1, y: 1 }),
    );
    const houseEntity = buildingPrefab(world, woodenHouse, position);
    const farm = resourcePrefab(
        world,
        farmResource,
        addPoint(position, { x: 1, y: 0 }),
    );
    //knight
    const knightEntity = world.createEntity();
    const drawableKnightComponent = new DrawableComponent({
        sprite: sprites2.knight,
    });
    const transformKnightComponent = new TransformComponent(
        addPoint(position, { x: 0, y: 1 }),
    );
    const colliderComponent = new ColliderComponent();
    world.addComponent(knightEntity, drawableKnightComponent);
    world.addComponent(knightEntity, transformKnightComponent);
    world.addComponent(knightEntity, colliderComponent);
    world.addComponent(knightEntity, new PlayerControllableActorComponent());
    world.addComponent(knightEntity, new JobComponent());
}
