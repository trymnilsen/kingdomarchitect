import type { NaturalResource } from "../inventory/items/naturalResource.ts";

export type ProductionDefinition = {
    kind: "zone";
    id: string;
    actionName: string;
    plantResourceId: NaturalResource["id"];
    zoneRadius: number;
    plantDuration: number;
    maxTreeFraction: number;
    minTreeFraction: number;
};

export const forresterProduction: ProductionDefinition = {
    kind: "zone",
    id: "forrester_production",
    actionName: "Tend Forest",
    plantResourceId: "tree1",
    zoneRadius: 2,
    plantDuration: 3,
    // maxTreeFraction = target population (plant up to this), reached before any
    // chopping starts. minTreeFraction = safety floor (never chop below this).
    maxTreeFraction: 0.8,
    minTreeFraction: 0.4,
};

const productionDefinitions: Record<string, ProductionDefinition> = {
    forrester_production: forresterProduction,
};

export function getProductionDefinition(
    id: string,
): ProductionDefinition | undefined {
    return productionDefinitions[id];
}
