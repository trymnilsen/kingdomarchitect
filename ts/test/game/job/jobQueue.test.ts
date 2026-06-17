import { describe, it } from "node:test";
import assert from "node:assert";
import {
    addJob,
    createJobQueueComponent,
    getJobById,
    moveJobToFront,
    removeJob,
} from "../../../src/game/component/jobQueueComponent.ts";
import type { Jobs } from "../../../src/game/job/job.ts";

// Minimal Jobs stand-ins: the queue helpers only read `id`.
function job(id: string): Jobs {
    return { id } as unknown as Jobs;
}

describe("JobQueue", () => {
    it("addJob pushes the job onto the queue", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        const b = job("b");
        addJob(queue, a);
        addJob(queue, b);
        assert.deepStrictEqual(queue.jobs, [a, b]);
    });

    it("removeJob removes the job with the matching id", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        const b = job("b");
        addJob(queue, a);
        addJob(queue, b);
        removeJob(queue, "a");
        assert.deepStrictEqual(queue.jobs, [b]);
    });

    it("removeJob is a no-op for an absent id", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        addJob(queue, a);
        removeJob(queue, "does-not-exist");
        assert.deepStrictEqual(queue.jobs, [a]);
    });

    it("moveJobToFront moves an existing job to index 0", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        const b = job("b");
        const c = job("c");
        addJob(queue, a);
        addJob(queue, b);
        addJob(queue, c);
        moveJobToFront(queue, c);
        assert.deepStrictEqual(queue.jobs, [c, a, b]);
    });

    it("moveJobToFront leaves the queue unchanged when the job is already first", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        const b = job("b");
        addJob(queue, a);
        addJob(queue, b);
        moveJobToFront(queue, a);
        assert.deepStrictEqual(queue.jobs, [a, b]);
    });

    it("getJobById parses the id as an index and returns that job", () => {
        const queue = createJobQueueComponent();
        const a = job("a");
        const b = job("b");
        const c = job("c");
        addJob(queue, a);
        addJob(queue, b);
        addJob(queue, c);
        assert.strictEqual(getJobById(queue, "0"), a);
        assert.strictEqual(getJobById(queue, "2"), c);
    });
});
