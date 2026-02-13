import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    QueueJobCommand,
    QueueJobCommandId,
} from "../../../../src/server/message/command/queueJobCommand.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import { AttackJob } from "../../../../src/game/job/attackJob.ts";

describe("QueueJobCommand", () => {
    it("creates command with correct id", () => {
        const job = CollectItemJob(new Entity("target"));

        const command = QueueJobCommand(job);

        assert.strictEqual(command.id, QueueJobCommandId);
        assert.strictEqual(command.id, "queueJob");
    });

    it("stores job in command", () => {
        const targetEntity = new Entity("chest1");
        const job = CollectItemJob(targetEntity);

        const command = QueueJobCommand(job);

        assert.strictEqual(command.job.id, "collectItem");
        assert.strictEqual((command.job as any).entityId, "chest1");
    });

    it("works with different job types", () => {
        const collectJob = CollectItemJob(new Entity("chest"));
        const attackJob = AttackJob("warrior1", "goblin1");

        const collectCommand = QueueJobCommand(collectJob);
        const attackCommand = QueueJobCommand(attackJob);

        assert.strictEqual(collectCommand.job.id, "collectItem");
        assert.strictEqual(attackCommand.job.id, "attackJob");
    });

    it("preserves job claimedBy", () => {
        const job = CollectItemJob(new Entity("target"));
        job.claimedBy = "worker-1";

        const command = QueueJobCommand(job);

        assert.strictEqual(command.job.claimedBy, "worker-1");
    });
});
