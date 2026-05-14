import assert from "node:assert";
import { describe, it } from "node:test";
import {
    generateId,
    getIdCounters,
    resetIdCounters,
    setIdCounters,
} from "../../../src/common/idGenerator.ts";

describe("idGenerator persistence", () => {
    it("avoids collisions with persisted IDs after restoring counters", () => {
        resetIdCounters();
        const persistedIds = new Set<string>();
        for (let i = 0; i < 5; i++) {
            persistedIds.add(generateId("worker"));
        }
        for (let i = 0; i < 3; i++) {
            persistedIds.add(generateId("chunk"));
        }

        const snapshot = getIdCounters();

        resetIdCounters();
        setIdCounters(snapshot);

        for (let i = 0; i < 4; i++) {
            const next = generateId("worker");
            assert.ok(
                !persistedIds.has(next),
                `Newly generated ID ${next} collides with a persisted ID`,
            );
        }
        const nextChunk = generateId("chunk");
        assert.ok(!persistedIds.has(nextChunk));
    });

    it("snapshot is decoupled from live counter state", () => {
        resetIdCounters();
        generateId("a");
        generateId("a");
        const snapshot = getIdCounters();
        generateId("a");

        assert.strictEqual(snapshot["a"], 2);
    });

    it("resetIdCounters restarts numbering at 1", () => {
        resetIdCounters();
        generateId("foo");
        generateId("foo");
        resetIdCounters();
        assert.strictEqual(generateId("foo"), "foo1");
    });
});
