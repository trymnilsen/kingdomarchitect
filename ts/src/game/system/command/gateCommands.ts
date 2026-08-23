import { log } from "../../../common/logging/logger.ts";
import type { SetGateOpenCommand } from "../../../server/message/command/setGateOpenCommand.ts";
import {
    GateComponentId,
    setGateOpen as applyGateOpen,
} from "../../component/gateComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Open or shut a gate on the player's order.
 *
 * The work itself lives in the gate component's setGateOpen (aliased here so
 * this handler can carry the command's own name), which keeps the gate's state,
 * its traversal weight and its sprite in step. This handler only resolves the
 * entity and checks it really is a gate.
 */
export function setGateOpen(root: Entity, command: SetGateOpenCommand) {
    const gate = root.findEntity(command.gate);
    if (!gate) {
        log.warn("Gate not found for SetGateOpen", { gate: command.gate });
        return;
    }

    if (!gate.getEcsComponent(GateComponentId)) {
        log.warn("Entity has no gate component for SetGateOpen", {
            gate: command.gate,
        });
        return;
    }

    applyGateOpen(gate, command.isOpen);
}
