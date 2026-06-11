import { distance } from "../../../common/point.ts";
import {
    greaterHealthPotion,
    healthPotion,
} from "../../../data/inventory/items/resources.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { HealthComponentId } from "../../component/healthComponent.ts";
import {
    getTopThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import { planDepositHeld } from "../../job/planner/planDepositHeld.ts";

export const DRINK_HP_FRACTION_THRESHOLD = 0.5;
export const GREATER_POTION_MISSING_HP = 120;
const MAX_UTILITY = 85;

/**
 * Drink a health potion when badly hurt. Never triggers while in combat —
 * a threatened worker stays in the fight and heals afterwards. The heal
 * effect applies on the next effect system tick after drinking, so the
 * behavior may briefly re-validate before the heal lands; the replan
 * discards the stale action queue.
 */
export function createDrinkPotionBehavior(): Behavior {
    return {
        name: "drinkPotion",

        isValid(entity: Entity): boolean {
            const health = entity.getEcsComponent(HealthComponentId);
            if (!health) return false;
            if (
                health.currentHp >=
                health.maxHp * DRINK_HP_FRACTION_THRESHOLD
            ) {
                return false;
            }
            return !isInCombat(entity);
        },

        utility(entity: Entity): number {
            const health = entity.getEcsComponent(HealthComponentId);
            if (!health) return 0;
            const hpFraction = health.currentHp / health.maxHp;
            if (hpFraction >= DRINK_HP_FRACTION_THRESHOLD) return 0;
            const raw = 50 + (DRINK_HP_FRACTION_THRESHOLD - hpFraction) * 70;
            return Math.min(MAX_UTILITY, raw);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const health = entity.getEcsComponent(HealthComponentId);
            if (!health) return [];

            // Stage 1: drink from held
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (held && !isHeldEmpty(held) && isPotion(held.item!.id)) {
                return [{ type: "drinkFromHeld" }];
            }

            const actions: BehaviorActionData[] = [];

            // Stage 2: Clear the held slot so a fetched potion can be drunk
            // from hand (planDepositHeld prefers a stockpile, drops otherwise)
            if (held && !isHeldEmpty(held)) {
                actions.push(...planDepositHeld(entity));
            }

            // Stage 3: walk to stockpile potion
            const missingHp = health.maxHp - health.currentHp;
            const stockpileActions = tryStockpileStage(entity, missingHp);
            if (stockpileActions) {
                actions.push(...stockpileActions);
                return actions;
            }

            // Stage 4: nothing viable
            return [];
        },
    };
}

/**
 * Pick which potion tier to drink for the given wound: the smallest that
 * is not wasted. Returns [preferred, fallback] item ids.
 */
export function choosePotionIds(missingHp: number): [string, string] {
    if (missingHp >= GREATER_POTION_MISSING_HP) {
        return [greaterHealthPotion.id, healthPotion.id];
    }
    return [healthPotion.id, greaterHealthPotion.id];
}

function isPotion(itemId: string): boolean {
    return itemId === healthPotion.id || itemId === greaterHealthPotion.id;
}

/**
 * Inverse of engageInCombatBehavior's validity check: in combat only if the
 * top threat still resolves to a live entity, so stale entries from slain
 * attackers don't block drinking.
 */
function isInCombat(entity: Entity): boolean {
    const threat = entity.getEcsComponent(ThreatMapComponentId);
    if (!threat) return false;

    const topId = getTopThreat(threat);
    if (!topId) return false;

    return entity.getRootEntity().findEntity(topId) !== null;
}

function tryStockpileStage(
    entity: Entity,
    missingHp: number,
): BehaviorActionData[] | null {
    const potionIds = choosePotionIds(missingHp);
    const settlement = getSettlementEntity(entity);
    const stockpiles = settlement.queryComponents(StockpileComponentId);

    // Nearest stockpile per tier; the fallback tier is only used when no
    // stockpile holds the preferred one
    const nearestEntities: (Entity | null)[] = [null, null];
    const nearestDists = [Infinity, Infinity];

    for (const [stockpileEntity] of stockpiles) {
        const stockpileInv =
            stockpileEntity.getEcsComponent(InventoryComponentId);
        if (!stockpileInv) continue;

        const d = distance(entity.worldPosition, stockpileEntity.worldPosition);
        for (let tier = 0; tier < potionIds.length; tier++) {
            const hasPotion = stockpileInv.items.some(
                (stack) => stack.item.id === potionIds[tier],
            );
            if (hasPotion && d < nearestDists[tier]) {
                nearestDists[tier] = d;
                nearestEntities[tier] = stockpileEntity;
            }
        }
    }

    const tier = nearestEntities[0] ? 0 : 1;
    const nearestEntity = nearestEntities[tier];
    if (!nearestEntity) return null;

    return [
        {
            type: "moveTo",
            target: nearestEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "withdrawFromStockpile",
            stockpileId: nearestEntity.id,
            itemId: potionIds[tier],
            amount: 1,
        },
        { type: "drinkFromHeld" },
    ];
}
