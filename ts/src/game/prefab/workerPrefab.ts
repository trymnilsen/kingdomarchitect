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
import { createHungerComponent } from "../component/hungerComponent.ts";
import { createEnergyComponent } from "../component/energyComponent.ts";
import { createBehaviorAgentComponent } from "../behavior/components/BehaviorAgentComponent.ts";
import { createRoleComponent } from "../component/worker/roleComponent.ts";

export function workerPrefab(): Entity {
    const entity = new Entity(generateId("worker"));
    const spriteComponent = createSpriteComponent(sprites2.empty_sprite);
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
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createRoleComponent());
    entity.setEcsComponent(createHungerComponent(60, 0.1)); // 0.1 per tick = ~7 minutes to go from 0 to 100
    entity.setEcsComponent(createEnergyComponent(100, 0.15, 20)); // 0.15 per tick = ~11 minutes to deplete
    return entity;
}
