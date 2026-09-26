import { describe, it } from "node:test";
import assert from "node:assert";
import {
    addJob,
    createJobQueueComponent,
    moveJobToFront,
} from "../../../src/game/component/jobQueueComponent.ts";
import type { Jobs } from "../../../src/game/job/job.ts";

// Minimal Jobs stand-ins: the queue helpers only read `id`.
function job(id: string): Jobs {
    return { id } as unknown as Jobs;
}

describe("JobQueue", () => {
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
});
