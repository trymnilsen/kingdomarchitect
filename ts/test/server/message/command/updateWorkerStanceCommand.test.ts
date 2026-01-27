import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    UpdateWorkerStanceCommand,
    UpdateWorkerStanceCommandId,
} from "../../../../src/server/message/command/updateWorkerStanceCommand.ts";
import { WorkerStance } from "../../../../src/game/component/worker/roleComponent.ts";

describe("UpdateWorkerStanceCommand", () => {
    it("creates command with correct id", () => {
        const worker = new Entity("worker1");
        const command = UpdateWorkerStanceCommand(worker, WorkerStance.Aggressive);

        assert.strictEqual(command.id, UpdateWorkerStanceCommandId);
        assert.strictEqual(command.id, "updateWorkerStance");
    });

    it("uses entity id from worker", () => {
        const worker = new Entity("villager1");
        const command = UpdateWorkerStanceCommand(worker, WorkerStance.Defensive);

        assert.strictEqual(command.worker, "villager1");
    });

    it("stores aggressive stance value", () => {
        const worker = new Entity("worker");
        const command = UpdateWorkerStanceCommand(worker, WorkerStance.Aggressive);

        assert.strictEqual(command.stance, WorkerStance.Aggressive);
    });

    it("stores defensive stance value", () => {
        const worker = new Entity("worker");
        const command = UpdateWorkerStanceCommand(worker, WorkerStance.Defensive);

        assert.strictEqual(command.stance, WorkerStance.Defensive);
    });

    it("creates separate commands for different stances", () => {
        const worker = new Entity("worker1");

        const aggressiveCommand = UpdateWorkerStanceCommand(
            worker,
            WorkerStance.Aggressive,
        );
        const defensiveCommand = UpdateWorkerStanceCommand(
            worker,
            WorkerStance.Defensive,
        );

        assert.strictEqual(aggressiveCommand.stance, WorkerStance.Aggressive);
        assert.strictEqual(defensiveCommand.stance, WorkerStance.Defensive);
        assert.strictEqual(aggressiveCommand.worker, defensiveCommand.worker);
    });
});
