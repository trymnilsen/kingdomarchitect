import { removeItem } from "../../../common/array.ts";
import { log } from "../../../common/logging/logger.ts";
import type { ChangeOccupationCommand } from "../../../server/message/command/changeOccupationCommand.ts";
import type { UpdateWorkerRoleCommand } from "../../../server/message/command/updateWorkerRoleCommand.ts";
import type { UpdateWorkerStanceCommand } from "../../../server/message/command/updateWorkerStanceCommand.ts";
import { OccupationComponentId } from "../../component/occupationComponent.ts";
import { RoleComponentId } from "../../component/worker/roleComponent.ts";
import { WorkplaceComponentId } from "../../component/workplaceComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Handlers for what a worker is and where it works.
 *
 * Occupation is the link between a worker and a building. Role and stance are
 * properties of the worker on its own, which is why they touch a single entity
 * while occupation has to keep both sides of the link in step.
 */
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

export function updateWorkerRole(
    root: Entity,
    command: UpdateWorkerRoleCommand,
) {
    const worker = root.findEntity(command.worker);
    if (!worker) {
        log.warn("Worker not found for UpdateWorkerRole", {
            worker: command.worker,
        });
        return;
    }

    const roleComponent = worker.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        log.warn("Worker has no role component", { worker: command.worker });
        return;
    }

    roleComponent.role = command.role;
    worker.invalidateComponent(RoleComponentId);
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
