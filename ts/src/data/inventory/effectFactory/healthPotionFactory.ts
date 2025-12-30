import { Effect } from "../../effect/effect.ts";
import { createHealEffect } from "../../effect/health/healEffect.ts";
import { InventoryItem } from "../inventoryItem.ts";

export function healthPotionFactory(_item: InventoryItem): Effect {
    return createHealEffect(25);
}
