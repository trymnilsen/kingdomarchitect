import type { Entity } from "../../../entity/entity.ts";
import type { BehaviorActionData } from "../../actions/Action.ts";
import type { Behavior } from "../Behavior.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { GoblinCampComponentId } from "../../../component/goblinCampComponent.ts";
import { FireSourceComponentId } from "../../../component/fireSourceComponent.ts";
import { HousingComponentId } from "../../../component/housingComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { planGoblinBuild } from "../../planners/goblinBuildPlanner.ts";
import { goblinHut } from "../../../../data/building/goblin/goblinHut.ts";

/**
 * ExpandCampBehavior - builds huts to grow population.
 * Activates when: camp has active fire AND below max population AND all huts occupied.
 * Utility: 40 (lower than normal work, but above idle)
 */
export function createExpandCampBehavior(): Behavior {
    return {
        name: "expandCamp",

        isValid(entity: Entity): boolean {
            const goblinUnit = entity.getEcsComponent(GoblinUnitComponentId);
            if (!goblinUnit) {
                return false;
            }

            const root = entity.getRootEntity();
            const campEntity = root.findEntity(goblinUnit.campEntityId);
            if (!campEntity) {
                return false;
            }

            const campComponent = campEntity.getEcsComponent(GoblinCampComponentId);
            if (!campComponent) {
                return false;
            }

            // Must have active fire
            if (!campHasActiveFire(campEntity)) {
                return false;
            }

            // Check population vs max
            const population = getCampPopulation(root, goblinUnit.campEntityId);
            if (population >= campComponent.maxPopulation) {
                return false;
            }

            // Check if all huts are occupied (need more huts)
            // Also returns true if there's a hut under construction
            const availableOrPendingHut = findAvailableOrPendingHut(campEntity);
            return availableOrPendingHut === null;
        },

        utility(_entity: Entity): number {
            return 40; // Lower priority expansion
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

            return planGoblinBuild(root, entity, campEntity, goblinHut);
        },
    };
}

function campHasActiveFire(campEntity: Entity): boolean {
    for (const child of campEntity.children) {
        const fireSource = child.getEcsComponent(FireSourceComponentId);
        if (fireSource?.isActive) {
            // Also check it's a completed building (not scaffolded)
            const building = child.getEcsComponent(BuildingComponentId);
            if (!building || !building.scaffolded) {
                return true;
            }
        }
    }
    return false;
}

function getCampPopulation(root: Entity, campEntityId: string): number {
    const goblins = root.queryComponents(GoblinUnitComponentId);
    let count = 0;
    for (const [_entity, goblinUnit] of goblins) {
        if (goblinUnit.campEntityId === campEntityId) {
            count++;
        }
    }
    return count;
}

function findAvailableOrPendingHut(campEntity: Entity): Entity | null {
    for (const child of campEntity.children) {
        const building = child.getEcsComponent(BuildingComponentId);
        if (!building || building.building.id !== goblinHut.id) {
            continue;
        }

        // If scaffolded, there's already a hut being built
        if (building.scaffolded) {
            return child;
        }

        // Check for available housing (completed hut with no tenant)
        const housing = child.getEcsComponent(HousingComponentId);
        if (housing && !housing.tenant) {
            return child;
        }
    }
    return null;
}
