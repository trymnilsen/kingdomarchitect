import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createRingBuffer,
    readEntries,
    tailEntries,
    writeEntry,
} from "../../src/common/ringBuffer.ts";

describe("createRingBuffer", () => {
    it("empty buffer reads as empty array", () => {
        const buf = createRingBuffer<number>(4);
        assert.deepStrictEqual(readEntries(buf), []);
    });

    it("single write then read returns that entry", () => {
        const buf = createRingBuffer<number>(4);
        writeEntry(buf, 42);
        assert.deepStrictEqual(readEntries(buf), [42]);
    });

    it("writes up to capacity and returns all entries oldest to newest", () => {
        const buf = createRingBuffer<number>(4);
        writeEntry(buf, 1);
        writeEntry(buf, 2);
        writeEntry(buf, 3);
        writeEntry(buf, 4);
        assert.deepStrictEqual(readEntries(buf), [1, 2, 3, 4]);
    });

    it("overwrites oldest entry when capacity is exceeded", () => {
        const buf = createRingBuffer<number>(4);
        writeEntry(buf, 1);
        writeEntry(buf, 2);
        writeEntry(buf, 3);
        writeEntry(buf, 4);
        writeEntry(buf, 5);
        // Entry 1 is overwritten; oldest remaining is 2
        assert.deepStrictEqual(readEntries(buf), [2, 3, 4, 5]);
    });

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
    it("returns the last n entries in oldest-to-newest order", () => {
        const buf = createRingBuffer<number>(8);
        for (let i = 1; i <= 6; i++) {
            writeEntry(buf, i);
        }
        assert.deepStrictEqual(tailEntries(buf, 3), [4, 5, 6]);
    });

    it("returns all entries when n exceeds stored count", () => {
        const buf = createRingBuffer<number>(8);
        writeEntry(buf, 10);
        writeEntry(buf, 20);
        assert.deepStrictEqual(tailEntries(buf, 100), [10, 20]);
    });

    it("returns empty array on empty buffer", () => {
        const buf = createRingBuffer<number>(4);
        assert.deepStrictEqual(tailEntries(buf, 5), []);
    });

    it("returns last n entries correctly after wrap-around", () => {
        const buf = createRingBuffer<number>(4);
        for (let i = 1; i <= 7; i++) {
            writeEntry(buf, i);
        }
        // Buffer holds 4, 5, 6, 7
        assert.deepStrictEqual(tailEntries(buf, 2), [6, 7]);
    });
});
