export type ProductionComponent = {
    id: typeof ProductionComponentId;
    productionId: string;
    maxWorkers: number;
};

export const ProductionComponentId = "production";

export function createProductionComponent(
    productionId: string,
    maxWorkers: number,
): ProductionComponent {
    return {
        id: ProductionComponentId,
        productionId,
        maxWorkers,
    };
}
