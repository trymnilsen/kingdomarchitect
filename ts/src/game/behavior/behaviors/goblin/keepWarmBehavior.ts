import type { Entity } from "../../../entity/entity.ts";
import type { BehaviorActionData } from "../../actions/Action.ts";
import type { Behavior } from "../Behavior.ts";
import { WarmthComponentId } from "../../../component/warmthComponent.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { FireSourceComponentId } from "../../../component/fireSourceComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { planGoblinBuild } from "../../planners/goblinBuildPlanner.ts";
import { goblinCampfire } from "../../../../data/building/goblin/goblinCampfire.ts";

/**
 * KeepWarmBehavior - highest priority goblin survival behavior.
 * Activates when warmth < 70.
 *
 * Utility scaling:
 * - warmth 70: utility = 60 (threshold)
 * - warmth 50: utility = 72
 * - warmth 30: utility = 83
 * - warmth 10: utility = 95 (near critical)
 */
export function createKeepWarmBehavior(): Behavior {
    return {
        name: "keepWarm",

        isValid(entity: Entity): boolean {
            const warmth = entity.getEcsComponent(WarmthComponentId);
            const goblinUnit = entity.getEcsComponent(GoblinUnitComponentId);

            if (!warmth || !goblinUnit) {
                return false;
            }

            // Valid when cold (warmth < 70)
            return warmth.warmth < 50;
        },

        utility(entity: Entity): number {
            const warmth = entity.getEcsComponent(WarmthComponentId);
            if (!warmth) {
                return 0;
            }

            if (warmth.warmth >= 50) {
                return 0;
            }

            // Scale from 60 (warmth=70) to 95 (warmth=10)
            const coldness = 50 - warmth.warmth;
            return Math.min(95, 60 + coldness * 0.58);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const root = entity.getRootEntity();
            const goblinUnit = entity.getEcsComponent(GoblinUnitComponentId);

            if (!goblinUnit) {
                return [];
            }

            const campEntity = root.findEntity(goblinUnit.campEntityId);
            if (!campEntity) {
                return [];
            }

            const warmth = entity.getEcsComponent(WarmthComponentId);
            const warmthValue = warmth?.warmth ?? 0;

            // Check if fire exists in camp
            const nearestFire = findNearestFireSource(campEntity);

            if (nearestFire) {
                console.log(
                    `[KeepWarm] Entity ${entity.id} going to warm at fire ${nearestFire.id} (warmth: ${warmthValue})`,
                );
                // Go warm up at fire
                return [
                    { type: "moveTo", target: nearestFire.worldPosition, stopAdjacent: "cardinal" },
                    { type: "warmByFire", fireEntityId: nearestFire.id },
                ];
            }

            console.log(
                `[KeepWarm] Entity ${entity.id} no fire found, planning to build campfire (warmth: ${warmthValue})`,
            );
            // No fire - need to build one
            return planGoblinBuild(root, entity, campEntity, goblinCampfire);
        },
    };
}

function findNearestFireSource(campEntity: Entity): Entity | null {
    for (const child of campEntity.children) {
        const fireSource = child.getEcsComponent(FireSourceComponentId);
        if (fireSource?.isActive) {
            // Also check it's a completed building (not scaffolded)
            const building = child.getEcsComponent(BuildingComponentId);
            if (!building || !building.scaffolded) {
                return child;
            }
        }
    }
    return null;
}
