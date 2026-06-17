import assert from "node:assert";
import { describe, it } from "node:test";
import { Completer } from "../../src/common/promise.ts";

describe("Completer", () => {
    it("resolveWith settles the promise with the value", async () => {
        const completer = new Completer<number>();
        completer.resolveWith(42);
        assert.strictEqual(await completer.promise, 42);
    });

    it("rejectWith rejects the promise", async () => {
        const completer = new Completer<number>();
        completer.rejectWith(new Error("nope"));
        await assert.rejects(completer.promise, /nope/);
    });

    it("dispose rejects an unsettled promise", async () => {
        const completer = new Completer<number>();
        completer.dispose();
        await assert.rejects(completer.promise);
    });
});
