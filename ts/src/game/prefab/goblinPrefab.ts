import { spriteRefs } from "../../asset/sprite.ts";
import { generateId } from "../../common/idGenerator.ts";
import { loopAnimation } from "../../rendering/animation/animationGraph.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { createBehaviorAgentComponent } from "../component/BehaviorAgentComponent.ts";
import { createInventoryComponent } from "../component/inventoryComponent.ts";
import { createWarmthComponent } from "../component/warmthComponent.ts";
import { createGoblinUnitComponent } from "../component/goblinUnitComponent.ts";
import { createFireSourceComponent } from "../component/fireSourceComponent.ts";
import { Entity } from "../entity/entity.ts";

/**
 * Creates a goblin entity with all necessary components for autonomous behavior.
 * If campEntityId is provided, the goblin will be linked to that camp.
 */
export function goblinPrefab(campEntityId?: string): Entity {
    const entity = new Entity(generateId("goblin"));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.goblin));
    entity.setEcsComponent(createHealthComponent(10, 10));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createInventoryComponent());
    entity.setEcsComponent(createWarmthComponent(80, 1.0)); // Start warm, decay 1/tick

    if (campEntityId) {
        entity.setEcsComponent(createGoblinUnitComponent(campEntityId));
    }

    return entity;
}

/**
 * Creates a goblin fireplace entity with fire source for warmth.
 * Note: For buildings created via buildingPrefab, use goblinCampfire building instead.
 * This is for pre-placed decorative firepits.
 */
export function goblinFireplace(): Entity {
    const entity = new Entity(generateId("goblinFireplace"));

    const loopingAnimation = loopAnimation(spriteRefs.stone_brazier, 4);
    entity.setEcsComponent(createAnimationComponent(loopingAnimation));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.stone_brazier));
    entity.setEcsComponent(createFireSourceComponent(15, 2, 1));

    return entity;
}
