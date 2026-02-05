/**
 * Marker component for buildings that act as stockpiles.
 * Stockpiles store settlement resources that workers can fetch from.
 */
export type StockpileComponent = {
    id: typeof StockpileComponentId;
};

export function createStockpileComponent(): StockpileComponent {
    return {
        id: StockpileComponentId,
    };
}

export const StockpileComponentId = "stockpile";
