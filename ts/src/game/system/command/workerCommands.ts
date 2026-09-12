import { removeItem } from "../../../common/array.ts";
import { log } from "../../../common/logging/logger.ts";
import type { ChangeOccupationCommand } from "../../../server/message/command/changeOccupationCommand.ts";
import type { SetRolePriorityCommand } from "../../../server/message/command/setRolePriorityCommand.ts";
import type { UpdateWorkerStanceCommand } from "../../../server/message/command/updateWorkerStanceCommand.ts";
import { requestReplan as requestBehaviorReplan } from "../../component/behaviorAgentComponent.ts";
import { OccupationComponentId } from "../../component/occupationComponent.ts";
import { RoleComponentId } from "../../component/worker/roleComponent.ts";
import { isValidRoleOrder } from "../../component/worker/rolePriority.ts";
import { WorkplaceComponentId } from "../../component/workplaceComponent.ts";
import type { Entity } from "../../entity/entity.ts";

export function changeOccupation(
    root: Entity,
    command: ChangeOccupationCommand,
) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        throw new Error(`Worker ${worker} not found`);
    }

    const workplace = root.findEntity(command.workplace);
    if (!workplace) {
        throw new Error(`workplace ${workplace} not found`);
    }

    const occupationComponent = worker.requireEcsComponent(
        OccupationComponentId,
    );

    const workplaceComponent =
        workplace.requireEcsComponent(WorkplaceComponentId);

    switch (command.action) {
        case "assign":
            occupationComponent.workplace = workplace.id;
            workplaceComponent.workers.push(worker.id);
            break;
        case "unassign":
            occupationComponent.workplace = undefined;
            removeItem(workplaceComponent.workers, worker.id);
            break;
    }

    worker.invalidateComponent(OccupationComponentId);
    workplace.invalidateComponent(WorkplaceComponentId);
}

/**
 * Replaces a worker's duty order. A malformed one is rejected rather than
 * repaired, since repairing leaves the worker holding something unchosen.
 */
export function setRolePriority(root: Entity, command: SetRolePriorityCommand) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        log.warn("Worker not found for setRolePriority", {
            worker: command.worker,
        });
        return;
    }

    const roleComponent = worker.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        log.warn("Worker has no role component", { worker: command.worker });
        return;
    }

    if (!isValidRoleOrder(command.dutyPriority, command.permittedDutyCount)) {
        log.warn("Refusing a malformed role order", {
            worker: command.worker,
            dutyPriority: command.dutyPriority,
            permittedDutyCount: command.permittedDutyCount,
        });
        return;
    }

    roleComponent.dutyPriority = [...command.dutyPriority];
    roleComponent.permittedDutyCount = command.permittedDutyCount;
    worker.invalidateComponent(RoleComponentId);

    // Explictly act on the new order now, not when the current plan happens
    // to run out. So you can immediately switch to a guard role for example
    requestBehaviorReplan(worker);
}

export function updateWorkerStance(
    root: Entity,
    command: UpdateWorkerStanceCommand,
) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        log.warn("Worker not found for UpdateWorkerStance", {
            worker: command.worker,
        });
        return;
    }

    const roleComponent = worker.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        log.warn("Worker has no role component for UpdateWorkerStance", {
            worker: command.worker,
        });
        return;
    }

    roleComponent.stance = command.stance;
    worker.invalidateComponent(RoleComponentId);
}
