import type { Entity } from "../entity/entity.ts";
import type { Behavior } from "./behaviors/Behavior.ts";
import type { BehaviorResolver } from "./systems/BehaviorSystem.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { createPerformPlayerCommandBehavior } from "./behaviors/PerformPlayerCommandBehavior.ts";
import { createSleepBehavior } from "./behaviors/SleepBehavior.ts";
import { createKeepWarmBehavior } from "./behaviors/goblin/keepWarmBehavior.ts";
import { createPerformJobBehavior } from "./behaviors/PerformJobBehavior.ts";
import { createHaulBehavior } from "./behaviors/HaulBehavior.ts";
import { planBuildBuilding } from "../job/planner/buildBuildingPlanner.ts";
import { planGoblinBuildJob } from "../job/planner/goblinBuildJobPlanner.ts";

/**
 * Creates a BehaviorResolver that returns applicable behaviors
 * based on the entity's components. Behavior instances are created
 * once and reused across all calls.
 */
export function createBehaviorResolver(): BehaviorResolver {
    const workerBehaviors: Behavior[] = [
        createPerformPlayerCommandBehavior(),
        createSleepBehavior(),
        createPerformJobBehavior(planBuildBuilding),
        createHaulBehavior(),
    ];

    const goblinBehaviors: Behavior[] = [
        createKeepWarmBehavior(),
        createPerformJobBehavior(planGoblinBuildJob, () => true),
    ];

    return function resolveBehaviors(entity: Entity): Behavior[] {
        if (entity.hasComponent(GoblinUnitComponentId)) {
            return goblinBehaviors;
        }
        return workerBehaviors;
    };
}
