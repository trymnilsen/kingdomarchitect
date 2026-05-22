import { distance } from "../../common/point.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import { getSettlementEntity } from "./settlementQueries.ts";
import type { Entity } from "./entity.ts";

/**
 * Find the nearest stockpile in the worker's settlement that will accept the
 * given item id. A stockpile with no preferences is treated as a generic
 * destination. Returns null if no stockpile accepts the item.
 */
export function findAcceptingStockpile(
    entity: Entity,
    itemId: string,
): Entity | null {
    const settlement = getSettlementEntity(entity);
    const stockpiles = settlement.queryComponents(StockpileComponentId);

    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const [stockpileEntity, stockpile] of stockpiles) {
        if (!stockpileEntity.getEcsComponent(InventoryComponentId)) continue;
        if (stockpile.preferredAmounts.length === 0) {
            const d = distance(
                entity.worldPosition,
                stockpileEntity.worldPosition,
            );
            if (d < bestDistance) {
                bestDistance = d;
                best = stockpileEntity;
            }
            continue;
        }
        const accepts = stockpile.preferredAmounts.some(
            (p) => p.itemId === itemId && p.amount > 0,
        );
        if (!accepts) continue;
        const d = distance(entity.worldPosition, stockpileEntity.worldPosition);
        if (d < bestDistance) {
            bestDistance = d;
            best = stockpileEntity;
        }
    }
    return best;
}
