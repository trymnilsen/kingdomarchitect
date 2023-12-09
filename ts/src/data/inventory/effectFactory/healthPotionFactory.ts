import { Effect } from "../../effect/effect.js";
import { createHealEffect } from "../../effect/health/healEffect.js";
import { InventoryItem } from "../inventoryItem.js";

export function healthPotionFactory(_item: InventoryItem): Effect {
    return createHealEffect(2);
}
