import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createRingBuffer,
    readEntries,
    tailEntries,
    writeEntry,
} from "../../src/common/ringBuffer.ts";

describe("createRingBuffer", () => {
    it("returns oldest to newest after multiple wrap-arounds", () => {
        const buf = createRingBuffer<number>(3);
        for (let i = 1; i <= 9; i++) {
            writeEntry(buf, i);
        }
        // Last 3 written are 7, 8, 9
        assert.deepStrictEqual(readEntries(buf), [7, 8, 9]);
    });

    it("total increments on every write", () => {
        const buf = createRingBuffer<number>(4);
        assert.strictEqual(buf.total, 0);
        writeEntry(buf, 1);
        assert.strictEqual(buf.total, 1);
        writeEntry(buf, 2);
        assert.strictEqual(buf.total, 2);
        // total keeps incrementing past capacity
        writeEntry(buf, 3);
        writeEntry(buf, 4);
        writeEntry(buf, 5);
        assert.strictEqual(buf.total, 5);
    });
});

describe("tailEntries", () => {
    it("returns last n entries correctly after wrap-around", () => {
        const buf = createRingBuffer<number>(4);
        for (let i = 1; i <= 7; i++) {
            writeEntry(buf, i);
        }
        // Buffer holds 4, 5, 6, 7
        assert.deepStrictEqual(tailEntries(buf, 2), [6, 7]);
    });
});
