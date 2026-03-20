import type { InventoryItem } from "../inventory/inventoryItem.ts";
import {
    stoneResource as stoneInventoryItem,
} from "../inventory/items/resources.ts";
import type { NaturalResource } from "../inventory/items/naturalResource.ts";

export type ProductionYield = {
    type: "item";
    item: InventoryItem;
    amount: number;
};

export type ProductionDefinition =
    | {
          kind: "extract";
          id: string;
          actionName: string;
          duration: number;
          yield: ProductionYield;
      }
    | {
          kind: "zone";
          id: string;
          actionName: string;
          plantResourceId: NaturalResource["id"];
          zoneRadius: number;
          plantDuration: number;
          maxTreeFraction: number;
          minTreeFraction: number;
      };

export const quarryProduction: ProductionDefinition = {
    kind: "extract",
    id: "quarry_production",
    actionName: "Mine Stone",
    duration: 10,
    yield: { type: "item", item: stoneInventoryItem, amount: 10 },
};

export const forresterProduction: ProductionDefinition = {
    kind: "zone",
    id: "forrester_production",
    actionName: "Plant Tree",
    plantResourceId: "tree1",
    zoneRadius: 4,
    plantDuration: 3,
    maxTreeFraction: 0.8,
    minTreeFraction: 0.4,
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
