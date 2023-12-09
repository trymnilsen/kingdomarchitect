import { Effect } from "../effect/effect.js";
import { InventoryItem } from "./inventoryItem.js";

export type EffectFactory = (item: InventoryItem) => Effect;
