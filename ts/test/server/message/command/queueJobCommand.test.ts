import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    QueueJobCommand,
    QueueJobCommandId,
} from "../../../../src/server/message/command/queueJobCommand.ts";
import { CollectItemJob } from "../../../../src/game/job/collectItemJob.ts";
import { MoveToJob } from "../../../../src/game/job/moveToPointJob.ts";

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
        const moveJob = MoveToJob(new Entity("worker"), { x: 5, y: 7 });

        const collectCommand = QueueJobCommand(collectJob);
        const moveCommand = QueueJobCommand(moveJob);

        assert.strictEqual(collectCommand.job.id, "collectItem");
        assert.strictEqual(moveCommand.job.id, "moveToJob");
    });

    it("preserves job claimedBy", () => {
        const job = CollectItemJob(new Entity("target"));
        job.claimedBy = "worker-1";

        const command = QueueJobCommand(job);

        assert.strictEqual(command.job.claimedBy, "worker-1");
    });
});
