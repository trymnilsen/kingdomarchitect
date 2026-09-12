import { log } from "../../../common/logging/logger.ts";
import type { SetOutputPolicyCommand } from "../../../server/message/command/setOutputPolicyCommand.ts";
import { OutputPolicyComponentId } from "../../component/outputPolicyComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Set what a production or crafting building does with what it has created
 */
export function setOutputPolicy(root: Entity, command: SetOutputPolicyCommand) {
    const building = root.findEntity(command.building);
    if (!building) {
        log.warn("Building not found for setting output policy", {
            building: command.building,
        });
        return;
    }

    const outputPolicy = building.getEcsComponent(OutputPolicyComponentId);
    if (!outputPolicy) {
        log.warn("No output component found on building", {
            building: command.building,
        });
        return;
    }

    outputPolicy.policy = command.policy;
    building.invalidateComponent(OutputPolicyComponentId);
}
