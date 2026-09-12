import type { Entity } from "../../entity/entity.ts";
import {
    RoleComponentId,
    allWorkerRoles,
    type WorkerRole,
} from "./roleComponent.ts";

/**
 * A first-choice role. Stays below orders and combat at 90, and below the peak
 * of sleep and eat
 */
export const TOP_ROLE_UTILITY = 58;

/**
 * Utility lost per rank. Larger than the replan hysteresis bonus, so the role a
 * worker just finished never outscores one it ranks higher
 */
export const ROLE_RANK_STEP = 6;

/**
 * How far down the worker's order this role sits, or -1 when the worker will
 * not perform it. An entity with no roles at all also reports -1
 */
export function getRoleRank(entity: Entity, role: WorkerRole): number {
    const roleComponent = entity.getEcsComponent(RoleComponentId);
    if (!roleComponent) {
        return -1;
    }
    const rank = roleComponent.dutyPriority.indexOf(role);
    if (rank >= roleComponent.permittedDutyCount) {
        return -1;
    }
    return rank;
}

/**
 * What the worker's ranking of this role is worth to behavior selection. The
 * last of eight ranks still scores above deposit and restock at 15
 */
export function roleUtility(entity: Entity, role: WorkerRole): number {
    const rank = getRoleRank(entity, role);
    if (rank < 0) {
        return 0;
    }
    return TOP_ROLE_UTILITY - rank * ROLE_RANK_STEP;
}

/** An order apart from its worker. The book edits a copy and sends the result */
export type RoleOrder = {
    dutyPriority: WorkerRole[];
    permittedDutyCount: number;
};

/** List positions as the player sees them: one per role, plus the dividing line */
export const ROLE_SLOT_COUNT = allWorkerRoles.length + 1;

/**
 * The line occupies the slot at permittedDutyCount, so an excluded role sits
 * one slot below its rank
 */
export function roleSlot(order: RoleOrder, role: WorkerRole): number {
    const rank = order.dutyPriority.indexOf(role);
    if (rank < order.permittedDutyCount) {
        return rank;
    }
    return rank + 1;
}

/**
 * Move a role up one slot. Crossing the threshold permits it again
 */
export function raiseRole(order: RoleOrder, role: WorkerRole): RoleOrder {
    const rank = order.dutyPriority.indexOf(role);
    if (rank < 0 || roleSlot(order, role) === 0) {
        return order;
    }
    if (rank === order.permittedDutyCount) {
        return {
            dutyPriority: [...order.dutyPriority],
            permittedDutyCount: order.permittedDutyCount + 1,
        };
    }
    return {
        dutyPriority: swapped(order.dutyPriority, rank, rank - 1),
        permittedDutyCount: order.permittedDutyCount,
    };
}

/**
 * Move a role down one slot, crossing the threshold decreases the
 * permitted count the same way
 */
export function lowerRole(order: RoleOrder, role: WorkerRole): RoleOrder {
    const rank = order.dutyPriority.indexOf(role);
    if (rank < 0 || roleSlot(order, role) === ROLE_SLOT_COUNT - 1) {
        return order;
    }
    if (rank === order.permittedDutyCount - 1) {
        return {
            dutyPriority: [...order.dutyPriority],
            permittedDutyCount: order.permittedDutyCount - 1,
        };
    }
    return {
        dutyPriority: swapped(order.dutyPriority, rank, rank + 1),
        permittedDutyCount: order.permittedDutyCount,
    };
}

function swapped(
    roles: readonly WorkerRole[],
    first: number,
    second: number,
): WorkerRole[] {
    const copy = [...roles];
    copy[first] = roles[second];
    copy[second] = roles[first];
    return copy;
}

/**
 * Every role exactly once, with the threshold inside the list. The command
 * handler rejects anything else rather than repairing it.
 */
export function isValidRoleOrder(
    dutyPriority: readonly WorkerRole[],
    permittedDutyCount: number,
): boolean {
    if (dutyPriority.length !== allWorkerRoles.length) {
        return false;
    }
    if (
        !Number.isInteger(permittedDutyCount) ||
        permittedDutyCount < 0 ||
        permittedDutyCount > dutyPriority.length
    ) {
        return false;
    }
    return allWorkerRoles.every(
        (role) => dutyPriority.filter((entry) => entry === role).length === 1,
    );
}
