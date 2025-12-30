import { Effect } from "../effect/effect.ts";
import { InventoryItem } from "./inventoryItem.ts";

export type EffectFactory = (item: InventoryItem) => Effect;
