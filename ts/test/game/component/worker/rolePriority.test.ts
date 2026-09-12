import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    getRoleRank,
    isValidRoleOrder,
    lowerRole,
    raiseRole,
    ROLE_RANK_STEP,
    ROLE_SLOT_COUNT,
    roleSlot,
    roleUtility,
    TOP_ROLE_UTILITY,
    type RoleOrder,
} from "../../../../src/game/component/worker/rolePriority.ts";
import {
    allWorkerRoles,
    createRoleComponent,
    WorkerRole,
} from "../../../../src/game/component/worker/roleComponent.ts";
import { REPLAN_THRESHOLD } from "../../../../src/game/behavior/systems/behaviorSystem.ts";
import {
    SLEEP_UTILITY_BASE,
    SLEEP_UTILITY_RANGE,
} from "../../../../src/game/behavior/behaviors/sleepBehavior.ts";
import { RESTOCK_UTILITY } from "../../../../src/game/behavior/behaviors/restockBehavior.ts";
import { DEPOSIT_HELD_UTILITY } from "../../../../src/game/behavior/behaviors/depositHeldBehavior.ts";
import { PLAYER_COMMAND_UTILITY } from "../../../../src/game/behavior/behaviors/performPlayerCommandBehavior.ts";
import { DAMAGE_UTILITY } from "../../../../src/game/behavior/behaviors/engageInCombatBehavior.ts";

/** An entity holding an order that permits the listed roles, in that order. */
function workerWith(permitted: WorkerRole[]): Entity {
    const worker = new Entity("worker");
    const roleComponent = createRoleComponent();
    roleComponent.dutyPriority = [
        ...permitted,
        ...allWorkerRoles.filter((role) => !permitted.includes(role)),
    ];
    roleComponent.permittedDutyCount = permitted.length;
    worker.setEcsComponent(roleComponent);
    return worker;
}

function orderOf(permitted: WorkerRole[]): RoleOrder {
    const roleComponent = workerWith(permitted).requireEcsComponent("role");
    return {
        dutyPriority: roleComponent.dutyPriority,
        permittedDutyCount: roleComponent.permittedDutyCount,
    };
}

describe("role rank", () => {
    it("ranks by position in the order and scores a step lower each time", () => {
        const worker = workerWith([...allWorkerRoles]);

        assert.strictEqual(getRoleRank(worker, allWorkerRoles[0]), 0);
        assert.strictEqual(getRoleRank(worker, allWorkerRoles[7]), 7);
        assert.strictEqual(
            roleUtility(worker, allWorkerRoles[0]),
            TOP_ROLE_UTILITY,
        );
        assert.strictEqual(
            roleUtility(worker, allWorkerRoles[7]),
            TOP_ROLE_UTILITY - 7 * ROLE_RANK_STEP,
        );
    });

    it("reports a role below the line as unranked rather than low-scoring", () => {
        const worker = workerWith([WorkerRole.Worker]);

        assert.strictEqual(getRoleRank(worker, WorkerRole.Guard), -1);
    });

    it("reports an entity with no roles as unranked", () => {
        const goblin = new Entity("goblin");

        assert.strictEqual(getRoleRank(goblin, WorkerRole.Worker), -1);
    });
});

describe("role utility band", () => {
    it("steps further than the replan bonus, so rank order always holds", () => {
        // Otherwise a just-finished second choice keeps beating the first.
        assert.ok(
            ROLE_RANK_STEP > REPLAN_THRESHOLD,
            `rank step ${ROLE_RANK_STEP} must exceed the ${REPLAN_THRESHOLD} point hysteresis bonus`,
        );
    });

    it("stays below orders, danger and an exhausted worker's need to sleep", () => {
        const stickiest = TOP_ROLE_UTILITY + REPLAN_THRESHOLD;

        assert.ok(stickiest < PLAYER_COMMAND_UTILITY);
        assert.ok(stickiest < DAMAGE_UTILITY);
        assert.ok(stickiest < SLEEP_UTILITY_BASE + SLEEP_UTILITY_RANGE);
    });

    it("keeps even the last-ranked role above tidying up", () => {
        const worker = workerWith([...allWorkerRoles]);
        const last = roleUtility(
            worker,
            allWorkerRoles[allWorkerRoles.length - 1],
        );

        assert.ok(last > RESTOCK_UTILITY);
        assert.ok(last > DEPOSIT_HELD_UTILITY);
    });
});

describe("role order validation", () => {
    it("accepts a permutation with the line anywhere in it", () => {
        for (let count = 0; count <= allWorkerRoles.length; count++) {
            assert.strictEqual(
                isValidRoleOrder([...allWorkerRoles], count),
                true,
            );
        }
    });

    it("rejects a repeated role", () => {
        const duplicated = [...allWorkerRoles];
        duplicated[1] = duplicated[0];

        assert.strictEqual(isValidRoleOrder(duplicated, 2), false);
    });

    it("rejects a short list, even one with no repeats", () => {
        assert.strictEqual(
            isValidRoleOrder(allWorkerRoles.slice(0, 7), 2),
            false,
        );
    });

    it("rejects a threshold outside the list", () => {
        assert.strictEqual(isValidRoleOrder([...allWorkerRoles], -1), false);
        assert.strictEqual(isValidRoleOrder([...allWorkerRoles], 9), false);
        assert.strictEqual(isValidRoleOrder([...allWorkerRoles], 1.5), false);
    });
});

describe("moving a role through the list", () => {
    it("swaps two permitted roles without touching the line", () => {
        const order = orderOf([WorkerRole.Worker, WorkerRole.Hauler]);

        const raised = raiseRole(order, WorkerRole.Hauler);

        assert.strictEqual(raised.dutyPriority[0], WorkerRole.Hauler);
        assert.strictEqual(raised.dutyPriority[1], WorkerRole.Worker);
        assert.strictEqual(raised.permittedDutyCount, 2);
    });

    it("excludes a role by lowering it past the line", () => {
        const order = orderOf([WorkerRole.Worker, WorkerRole.Hauler]);

        const lowered = lowerRole(order, WorkerRole.Hauler);

        assert.strictEqual(lowered.permittedDutyCount, 1);
        assert.deepStrictEqual(
            lowered.dutyPriority,
            order.dutyPriority,
            "crossing the line changes what is permitted, not the order",
        );
    });

    it("brings a role back by raising it past the line", () => {
        const order = orderOf([WorkerRole.Worker]);
        const firstExcluded = order.dutyPriority[1];

        const raised = raiseRole(order, firstExcluded);

        assert.strictEqual(raised.permittedDutyCount, 2);
        assert.deepStrictEqual(raised.dutyPriority, order.dutyPriority);
    });

    it("puts a worker with nothing permitted back to work one raise at a time", () => {
        const order = orderOf([]);

        const raised = raiseRole(order, order.dutyPriority[0]);

        assert.strictEqual(raised.permittedDutyCount, 1);
    });

    it("refuses to move past either end of the list", () => {
        const everythingPermitted = orderOf([...allWorkerRoles]);
        const top = everythingPermitted.dutyPriority[0];

        const nothingPermitted = orderOf([]);
        const bottom = nothingPermitted.dutyPriority[7];

        assert.strictEqual(roleSlot(everythingPermitted, top), 0);
        assert.strictEqual(
            roleSlot(nothingPermitted, bottom),
            ROLE_SLOT_COUNT - 1,
            "the last excluded role sits in the final slot, below the line",
        );
        assert.strictEqual(
            raiseRole(everythingPermitted, top),
            everythingPermitted,
        );
        assert.strictEqual(
            lowerRole(nothingPermitted, bottom),
            nothingPermitted,
        );
    });

    it("keeps every order it produces valid", () => {
        let order = orderOf([WorkerRole.Worker, WorkerRole.Hauler]);

        for (const role of allWorkerRoles) {
            order = lowerRole(order, role);
            assert.strictEqual(
                isValidRoleOrder(order.dutyPriority, order.permittedDutyCount),
                true,
            );
            order = raiseRole(order, role);
            assert.strictEqual(
                isValidRoleOrder(order.dutyPriority, order.permittedDutyCount),
                true,
            );
        }
    });
});
