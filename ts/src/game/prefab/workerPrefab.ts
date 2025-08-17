import { generateId } from "../../common/idGenerator.js";
import { sprites2 } from "../../asset/sprite.js";
import { createEquipmentComponent } from "../component/equipmentComponent.js";
import {
    createInventoryComponent,
    defaultInventoryItems,
} from "../component/inventoryComponent.js";
import { createJobRunnerComponent } from "../component/jobRunnerComponent.js";
import { createPlayerUnitComponent } from "../component/playerUnitComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";
import { createVisibilityComponent } from "../component/visibilityComponent.js";
import { createAnimationComponent } from "../component/animationComponent.js";
import { nobleKnightAnimationGraph } from "../../asset/animation/knight.animation.js";
import { createDirectionComponent } from "../component/directionComponent.js";

export function workerPrefab(): Entity {
    const entity = new Entity(generateId("worker"));
    const spriteComponent = createSpriteComponent(sprites2.knight);
    entity.setEcsComponent(spriteComponent);
    entity.setEcsComponent(createPlayerUnitComponent());
    entity.setEcsComponent(createJobRunnerComponent());
    entity.setEcsComponent(createEquipmentComponent());
    entity.setEcsComponent(createInventoryComponent(defaultInventoryItems()));
    entity.setEcsComponent(createVisibilityComponent());
    entity.setEcsComponent(createAnimationComponent(nobleKnightAnimationGraph));
    entity.setEcsComponent(createDirectionComponent());
    return entity;
}
