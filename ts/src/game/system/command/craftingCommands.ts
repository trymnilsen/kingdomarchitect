import { log } from "../../../common/logging/logger.ts";
import type { SetCraftingOutputPolicyCommand } from "../../../server/message/command/setCraftingOutputPolicyCommand.ts";
import { CraftingComponentId } from "../../component/craftingComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Handlers for how a crafting building is run.
 */
export function setCraftingOutputPolicy(
    root: Entity,
    command: SetCraftingOutputPolicyCommand,
) {
    const building = root.findEntity(command.building);
    if (!building) {
        log.warn("Building not found for SetCraftingOutputPolicy", {
            building: command.building,
        });
        return;
    }

    const crafting = building.getEcsComponent(CraftingComponentId);
    if (!crafting) {
        log.warn(
            "Entity has no crafting component for SetCraftingOutputPolicy",
            {
                building: command.building,
            },
        );
        return;
    }

    crafting.outputPolicy = command.policy;
    building.invalidateComponent(CraftingComponentId);
}
