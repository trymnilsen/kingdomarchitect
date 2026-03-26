import type { DesiredInventoryEntry } from "../../../game/component/desiredInventoryComponent.ts";

export type UpdateDesiredInventoryCommand = {
    id: typeof UpdateDesiredInventoryCommandId;
    entityId: string;
    items: DesiredInventoryEntry[];
};

export function UpdateDesiredInventoryCommand(
    entityId: string,
    items: DesiredInventoryEntry[],
): UpdateDesiredInventoryCommand {
    return {
        id: UpdateDesiredInventoryCommandId,
        entityId,
        items,
    };
}

export const UpdateDesiredInventoryCommandId = "updateDesiredInventory";
