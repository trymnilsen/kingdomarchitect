import type { Entity } from "../entity/entity.ts";
import type { Behavior } from "./behaviors/behavior.ts";
import type { BehaviorResolver } from "./systems/behaviorSystem.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { createPerformPlayerCommandBehavior } from "./behaviors/performPlayerCommandBehavior.ts";
import { createSleepBehavior } from "./behaviors/sleepBehavior.ts";
import { createKeepWarmBehavior } from "./behaviors/goblin/keepWarmBehavior.ts";
import { createRaidBehavior } from "./behaviors/goblin/raidBehavior.ts";
import { createPerformJobBehavior } from "./behaviors/performJobBehavior.ts";
import { createGarrisonBehavior } from "./behaviors/garrisonBehavior.ts";
import { createDepositHeldBehavior } from "./behaviors/depositHeldBehavior.ts";
import { createRestockBehavior } from "./behaviors/restockBehavior.ts";
import { createEatBehavior } from "./behaviors/eatBehavior.ts";
import { createDrinkPotionBehavior } from "./behaviors/drinkPotionBehavior.ts";
import { createEngageInCombatBehavior } from "./behaviors/engageInCombatBehavior.ts";
import { createStepOutsideBehavior } from "./behaviors/stepOutsideBehavior.ts";
import { planBuildBuilding } from "../job/planner/buildBuildingPlanner.ts";
import { planGoblinBuildJob } from "../job/planner/goblinBuildJobPlanner.ts";
import { canExecuteBuildJob } from "../job/buildBuildingJob.ts";

/**
 * Creates a BehaviorResolver that returns the behaviors applicable to an
 * entity. Behavior instances are created once and reused across all calls.
 *
 * Goblins get their own shorter list. They take no player commands, have no
 * EnergyComponent (warmth is their survival stat), and belong to a camp rather
 * than the root tree, so the worker behaviors that look for stockpiles under
 * the kingdom would search the wrong place.
 *
 * The `() => true` validator on goblin performJob bypasses the stockpile
 * pre-check player workers use. Goblins gather from the environment, so that
 * check would always fail for them.
 */
export function createBehaviorResolver(): BehaviorResolver {
    const workerBehaviors: Behavior[] = [
        createStepOutsideBehavior(),
        createPerformPlayerCommandBehavior(),
        createEngageInCombatBehavior(),
        createSleepBehavior(),
        createEatBehavior(),
        createDrinkPotionBehavior(),
        createGarrisonBehavior(),
        createPerformJobBehavior(planBuildBuilding, canExecuteBuildJob, true),
        createDepositHeldBehavior(),
        createRestockBehavior(),
    ];

    const goblinBehaviors: Behavior[] = [
        createEngageInCombatBehavior(),
        createRaidBehavior(),
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
