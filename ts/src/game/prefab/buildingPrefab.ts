import { generateId } from "../../common/idGenerator.js";
import type { Building } from "../../data/building/building.js";
import { sprites2 } from "../../module/asset/sprite.js";
import { createBuildingComponent } from "../component/buildingComponent.js";
import { createHealthComponent } from "../component/healthComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function buildingPrefab(
    building: Building,
    startScaffolded: boolean = false,
): Entity {
    const entity = new Entity(generateId("building"));
    entity.setEcsComponent(createBuildingComponent(building));
    entity.setEcsComponent(createHealthComponent(10, 100));
    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? sprites2.wooden_house_scaffold : building.icon,
            { x: 3, y: 2 },
        ),
    );
    return entity;
}
