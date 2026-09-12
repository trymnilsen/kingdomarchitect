export type ProductionComponent = {
    id: typeof ProductionComponentId;
    productionId: string;
};

export const ProductionComponentId = "production";

export function createProductionComponent(
    productionId: string,
): ProductionComponent {
    return {
        id: ProductionComponentId,
        productionId,
    };
}
