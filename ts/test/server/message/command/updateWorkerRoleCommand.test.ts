import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    UpdateWorkerRoleCommand,
    UpdateWorkerRoleCommandId,
} from "../../../../src/server/message/command/updateWorkerRoleCommand.ts";
import { WorkerRole } from "../../../../src/game/component/worker/roleComponent.ts";

describe("UpdateWorkerRoleCommand", () => {
    it("creates command with correct id", () => {
        const worker = new Entity("worker1");
        const command = UpdateWorkerRoleCommand(worker, WorkerRole.Guard);

        assert.strictEqual(command.id, UpdateWorkerRoleCommandId);
        assert.strictEqual(command.id, "updateWorkerRole");
    });

    it("uses entity id from worker", () => {
        const worker = new Entity("villager1");
        const command = UpdateWorkerRoleCommand(worker, WorkerRole.Explorer);

        assert.strictEqual(command.worker, "villager1");
    });

    it("stores role value", () => {
        const worker = new Entity("worker");
        const command = UpdateWorkerRoleCommand(worker, WorkerRole.Trader);

        assert.strictEqual(command.role, WorkerRole.Trader);
    });

    it("creates separate commands for different roles", () => {
        const worker = new Entity("worker1");

        const guardCommand = UpdateWorkerRoleCommand(worker, WorkerRole.Guard);
        const spyCommand = UpdateWorkerRoleCommand(worker, WorkerRole.Spy);

        assert.strictEqual(guardCommand.role, WorkerRole.Guard);
        assert.strictEqual(spyCommand.role, WorkerRole.Spy);
        assert.strictEqual(guardCommand.worker, spyCommand.worker);
    });

    it("stores all role types correctly", () => {
        const worker = new Entity("worker");

        const workerCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Worker);
        const explorerCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Explorer);
        const guardCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Guard);
        const devoteeCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Devotee);
        const spyCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Spy);
        const envoyCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Envoy);
        const traderCmd = UpdateWorkerRoleCommand(worker, WorkerRole.Trader);

        assert.strictEqual(workerCmd.role, WorkerRole.Worker);
        assert.strictEqual(explorerCmd.role, WorkerRole.Explorer);
        assert.strictEqual(guardCmd.role, WorkerRole.Guard);
        assert.strictEqual(devoteeCmd.role, WorkerRole.Devotee);
        assert.strictEqual(spyCmd.role, WorkerRole.Spy);
        assert.strictEqual(envoyCmd.role, WorkerRole.Envoy);
        assert.strictEqual(traderCmd.role, WorkerRole.Trader);
    });
});
