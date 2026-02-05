import type { InventoryItem } from "../inventory/inventoryItem.ts";
import {
    stoneResource as stoneInventoryItem,
    woodResourceItem,
} from "../inventory/items/resources.ts";

export type PlacementPattern = "diamond" | "nearest";

export type ProductionYield =
    | { type: "item"; item: InventoryItem; amount: number }
    | { type: "entity"; resourceId: string; placement: PlacementPattern };

export type ProductionDefinition = {
    id: string;
    actionName: string;
    duration: number;
    yield: ProductionYield;
};

export const quarryProduction: ProductionDefinition = {
    id: "quarry_production",
    actionName: "Mine Stone",
    duration: 10,
    yield: { type: "item", item: stoneInventoryItem, amount: 10 },
};

export const forresterProduction: ProductionDefinition = {
    id: "forrester_production",
    actionName: "Plant Tree",
    duration: 8,
    yield: { type: "entity", resourceId: "tree1", placement: "diamond" },
};

const productionDefinitions: Record<string, ProductionDefinition> = {
    quarry_production: quarryProduction,
    forrester_production: forresterProduction,
};

export function getProductionDefinition(
    id: string,
): ProductionDefinition | undefined {
    return productionDefinitions[id];
}
