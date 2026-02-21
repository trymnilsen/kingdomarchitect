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
 *
 * Worker behaviors (standard human NPCs):
 *   - performPlayerCommand: direct player orders, highest priority
 *   - sleep: energy recovery when exhausted
 *   - performJob: claim and execute jobs from the root job queue
 *   - haul: deposit loose inventory items to stockpiles when idle
 *
 * Goblin behaviors:
 *   - keepWarm: survival — go to fire or build one if none exists
 *   - performJob: claim and execute jobs from the camp job queue
 *
 * Goblins don't get sleep/haul/playerCommand because:
 *   - They aren't directly controlled by the player
 *   - They don't have an EnergyComponent (warmth is their survival stat)
 *   - They belong to a camp, not the root entity tree, so haul
 *     would look for stockpiles in the wrong place anyway
 *
 * The `() => true` validator for goblin performJob bypasses the
 * stockpile check used by player workers — goblins gather materials
 * from the environment directly, so the pre-check would always fail.
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
