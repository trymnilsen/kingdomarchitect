import { log } from "../../../common/logging/logger.ts";
import type { SetPreferredAmountCommand } from "../../../server/message/command/setPreferredAmountCommand.ts";
import {
    setPreferredAmount,
    StockpileComponentId,
} from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Sets how much of an item a stockpile wants to keep on hand. Hauling jobs read
 * that target later to decide what still needs moving.
 */
export function setStockpilePreferredAmount(
    root: Entity,
    command: SetPreferredAmountCommand,
) {
    const stockpile = root.findEntity(command.stockpileEntityId);
    if (!stockpile) {
        log.warn("Stockpile not found for SetPreferredAmount", {
            entityId: command.stockpileEntityId,
        });
        return;
    }

    const stockpileComponent = stockpile.getEcsComponent(StockpileComponentId);
    if (!stockpileComponent) {
        log.warn("Entity is not a stockpile", {
            entityId: command.stockpileEntityId,
        });
        return;
    }

    setPreferredAmount(stockpileComponent, command.itemId, command.amount);
    stockpile.invalidateComponent(StockpileComponentId);
}
