import type { Entity } from "../../../entity/entity.ts";
import type { BehaviorActionData } from "../../actions/Action.ts";
import type { Behavior } from "../Behavior.ts";
import { GoblinUnitComponentId } from "../../../component/goblinUnitComponent.ts";
import { StockpileComponentId } from "../../../component/stockpileComponent.ts";
import { BuildingComponentId } from "../../../component/buildingComponent.ts";
import { planGoblinBuild } from "../../planners/goblinBuildPlanner.ts";
import { stockPile } from "../../../../data/building/wood/storage.ts";
import { firstChildWhere } from "../../../entity/child/first.ts";

/**
 * BuildStockpileBehavior - builds a stockpile when camp has multiple goblins.
 * Activates when: camp population > 1 AND no stockpile exists.
 * Utility: 50 (normal work priority)
 */
export function createBuildStockpileBehavior(): Behavior {
    return {
        name: "buildStockpile",

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

            // Check population > 1
            const campPopulation = getCampPopulation(
                root,
                goblinUnit.campEntityId,
            );
            if (campPopulation <= 1) {
                return false;
            }

            // Check no stockpile exists in camp (completed or scaffolded)
            const hasStockpile = campHasStockpile(campEntity);
            return !hasStockpile;
        },

        utility(_entity: Entity): number {
            return 50; // Normal work priority
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

            return planGoblinBuild(root, entity, campEntity, stockPile);
        },
    };
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

function campHasStockpile(campEntity: Entity): boolean {
    const stockPileEntity = firstChildWhere(campEntity, (entity) => {
        // Check for completed stockpile
        if (entity.hasComponent(StockpileComponentId)) {
            return true;
        }
        // Check for scaffolded stockpile
        const building = entity.getEcsComponent(BuildingComponentId);
        if (building?.building.id === stockPile.id) {
            return true;
        }

        return false;
    });

    return !!stockPileEntity;
}
