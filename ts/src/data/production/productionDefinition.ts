export type ProductionDefinition = {
    kind: "zone";
    id: string;
    actionName: string;
    zoneRadius: number;
    plantDuration: number;
    maxTreeFraction: number;
    minTreeFraction: number;
};

export const forresterProduction: ProductionDefinition = {
    kind: "zone",
    id: "forrester_production",
    actionName: "Harvest Timber",
    zoneRadius: 2,
    plantDuration: 3,
    // maxTreeFraction = target population the worker plants toward.
    // minTreeFraction = safety floor: below it the worker only plants, so a
    // thinned-out zone regrows instead of being cleared for the last order.
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
