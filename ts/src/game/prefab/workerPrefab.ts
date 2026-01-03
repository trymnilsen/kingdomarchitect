import { generateId } from "../../common/idGenerator.ts";
import { sprites2 } from "../../asset/sprite.ts";
import { createEquipmentComponent } from "../component/equipmentComponent.ts";
import {
    createInventoryComponent,
    defaultInventoryItems,
} from "../component/inventoryComponent.ts";
import { createJobRunnerComponent } from "../component/jobRunnerComponent.ts";
import { createPlayerUnitComponent } from "../component/playerUnitComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";
import { createVisibilityComponent } from "../component/visibilityComponent.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { nobleKnightAnimationGraph } from "../../asset/animation/knight.animation.ts";
import { createDirectionComponent } from "../component/directionComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createOccupationComponent } from "../component/occupationComponent.ts";
import { createGoapAgentComponent } from "../component/goapAgentComponent.ts";

export function workerPrefab(): Entity {
    const entity = new Entity(generateId("worker"));
    const spriteComponent = createSpriteComponent(sprites2.knight);
    entity.setEcsComponent(spriteComponent);
    entity.setEcsComponent(createHealthComponent(50, 100));
    entity.setEcsComponent(createPlayerUnitComponent());
    entity.setEcsComponent(createJobRunnerComponent());
    entity.setEcsComponent(createEquipmentComponent());
    entity.setEcsComponent(createInventoryComponent(defaultInventoryItems()));
    entity.setEcsComponent(createVisibilityComponent());
    entity.setEcsComponent(createAnimationComponent(nobleKnightAnimationGraph));
    entity.setEcsComponent(createDirectionComponent());
    entity.setEcsComponent(createOccupationComponent());
    entity.setEcsComponent(createGoapAgentComponent());
    return entity;
}
