import { SpecialRequirement } from "../../data/building/building.ts";
import { workshop } from "../../data/building/stone/workshop.ts";
import { wizardHat } from "../../data/inventory/items/equipment.ts";
import { blueBook, gemResource } from "../../data/inventory/items/resources.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import {
    RoleComponentId,
    WorkerRole,
} from "../component/worker/roleComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { findStockpiles } from "../entity/settlementQueries.ts";

/**
 * Items that count as a magical focus. Any one of them satisfies the
 * requirement, so a settlement can qualify by looting a gem, by scribing a
 * tome, or by whatever it was that made someone the wizard.
 */
const magicalFocusItemIds: readonly string[] = [
    gemResource.id,
    blueBook.id,
    wizardHat.id,
];

/**
 * Whether the settlement currently employs anyone in the given role.
 *
 * Roles are worker state rather than building state, which is why the devotee
 * requirements read people and the carving requirement reads buildings.
 */
function settlementHasRole(settlement: Entity, role: WorkerRole): boolean {
    const roles = settlement.queryComponents(RoleComponentId);
    for (const [, roleComponent] of roles) {
        if (roleComponent.role === role) {
            return true;
        }
    }
    return false;
}

/**
 * Whether a completed building of the given type stands in the settlement.
 * Scaffolding does not count: a half-built workshop has taught nobody to carve.
 */
function settlementHasBuilding(
    settlement: Entity,
    buildingId: string,
): boolean {
    const buildings = settlement.queryComponents(BuildingComponentId);
    for (const [, buildingComponent] of buildings) {
        if (
            buildingComponent.building.id === buildingId &&
            !buildingComponent.scaffolded
        ) {
            return true;
        }
    }
    return false;
}

/** Whether any stockpile in the settlement holds at least one of the items. */
function settlementHoldsAnyItem(
    settlement: Entity,
    itemIds: readonly string[],
): boolean {
    for (const stockpile of findStockpiles(settlement)) {
        const inventory = stockpile.getEcsComponent(InventoryComponentId);
        if (!inventory) continue;
        for (const stack of inventory.items) {
            if (stack.amount > 0 && itemIds.includes(stack.item.id)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Whether the settlement satisfies one special building requirement.
 *
 * Each of these asks the settlement for something it cannot buy with materials:
 * a person of the right calling, a place that teaches a craft, or an object
 * worth building around. That is the point of them being separate from the
 * material list.
 */
export function checkSpecialRequirement(
    settlement: Entity,
    requirement: SpecialRequirement,
): boolean {
    switch (requirement) {
        case SpecialRequirement.DevoteeConsecration:
        case SpecialRequirement.DevoteeLabor:
            return settlementHasRole(settlement, WorkerRole.Devotee);
        case SpecialRequirement.SkilledCarving:
            return settlementHasBuilding(settlement, workshop.id);
        case SpecialRequirement.MagicalFocusItem:
            return settlementHoldsAnyItem(settlement, magicalFocusItemIds);
    }
}

/**
 * The special requirements the settlement does not currently meet. Empty means
 * nothing stands in the way.
 */
export function findUnmetSpecialRequirements(
    settlement: Entity,
    requirements: readonly SpecialRequirement[] | undefined,
): SpecialRequirement[] {
    if (!requirements) {
        return [];
    }
    return requirements.filter(
        (requirement) => !checkSpecialRequirement(settlement, requirement),
    );
}
