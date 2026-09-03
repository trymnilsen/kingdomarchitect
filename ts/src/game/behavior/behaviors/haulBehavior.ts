import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    RoleComponentId,
    WorkerRole,
} from "../../component/worker/roleComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { CollectableComponentId } from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import {
    computeHearthlight,
    isInHearthlight,
} from "../../light/hearthlight.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";
import type { Behavior } from "./behavior.ts";

/** Same band as garrison. Haulers are out of the job pool, so jobs (50) need not be outranked. */
const HAUL_UTILITY = 40;

/**
 * HaulBehavior: a Hauler walks to the nearest ground pile inside the hearthlight
 * and picks it up. With a full hand it is no longer valid and DepositHeldBehavior
 * takes the load to a stockpile, so the two hand off through the held slot.
 *
 * Only piles some stockpile accepts are considered, or the hauler would stand
 * holding something with nowhere to put it, invalid for both behaviors.
 *
 * Haulers do not claim piles. Two may set out for the same one; the second
 * fails its pickup with targetGone and replans.
 */
export function createHaulBehavior(): Behavior {
    return {
        name: "haul",

        isValid(entity: Entity): boolean {
            const role = entity.getEcsComponent(RoleComponentId);
            if (role?.role !== WorkerRole.Hauler) {
                return false;
            }
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (!held || !isHeldEmpty(held)) {
                return false;
            }
            return nearestLitPile(entity) !== null;
        },

        utility(_entity: Entity): number {
            return HAUL_UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const pile = nearestLitPile(entity);
            if (!pile) {
                return [];
            }
            return [
                {
                    type: "moveTo",
                    target: pile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                { type: "pickupFromGround", pileEntityId: pile.id },
            ];
        },
    };
}

type PileCandidate = {
    pile: Entity;
    itemId: string;
};

/**
 * The closest ground pile inside the hearthlight whose item a stockpile in the
 * hauler's settlement will take, or null. A pile holds one item id by
 * construction (see collectableItemPrefab), so the first stack decides it.
 *
 * Piles are gathered before the hearthlight is computed: the compute is not
 * cheap and an idle hauler asks every tick, so an empty yard must return early.
 */
function nearestLitPile(hauler: Entity): Entity | null {
    const root = hauler.getRootEntity();

    const candidates: PileCandidate[] = [];
    for (const [pile] of root.queryComponents(GroundItemComponentId)) {
        const collectable = pile.getEcsComponent(CollectableComponentId);
        if (!collectable || collectable.items.length === 0) {
            continue;
        }
        candidates.push({ pile, itemId: collectable.items[0].item.id });
    }
    if (candidates.length === 0) {
        return null;
    }

    const hearthlight = computeHearthlight(root);
    if (hearthlight.size === 0) {
        return null;
    }

    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const { pile, itemId } of candidates) {
        if (!isInHearthlight(hearthlight, pile.worldPosition)) {
            continue;
        }
        if (findAcceptingStockpile(hauler, itemId) === null) {
            continue;
        }
        const d = distance(hauler.worldPosition, pile.worldPosition);
        if (d < bestDistance) {
            best = pile;
            bestDistance = d;
        }
    }
    return best;
}
