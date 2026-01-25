import type { Effect } from "../effect/effect.ts";
import type { InventoryItem } from "./inventoryItem.ts";

export type EffectFactory = (item: InventoryItem) => Effect;
