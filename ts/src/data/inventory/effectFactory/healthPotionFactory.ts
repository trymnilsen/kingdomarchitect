import type { Effect } from "../../effect/effect.ts";
import { createHealEffect } from "../../effect/health/healEffect.ts";
import type { InventoryItem } from "../inventoryItem.ts";

export function healthPotionFactory(_item: InventoryItem): Effect {
    return createHealEffect(25);
}
