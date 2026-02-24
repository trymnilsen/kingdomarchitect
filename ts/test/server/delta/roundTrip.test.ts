import { describe, it } from "node:test";
import assert from "node:assert";
import {
    diffComponents,
    deepEquals,
} from "../../../src/server/delta/diffComponent.ts";
import { applyDelta } from "../../../src/server/delta/applyDelta.ts";
import type { Components } from "../../../src/game/component/component.ts";

/**
 * Helper: clone old, diff old vs new, apply delta to clone, assert equals new.
 */
function assertRoundTrip(
    old: Record<string, unknown>,
    updated: Record<string, unknown>,
) {
    const oldComp = old as unknown as Components;
    const newComp = updated as unknown as Components;
    const clone = structuredClone(old) as unknown as Components;
    const ops = diffComponents(oldComp, newComp);
    applyDelta(clone, ops);
    assert.ok(
        deepEquals(clone, newComp),
        `Round-trip failed.\nExpected: ${JSON.stringify(updated)}\nGot: ${JSON.stringify(clone)}`,
    );
}

describe("diff -> apply round-trip", () => {
    it("handles primitive value change", () => {
        assertRoundTrip(
            { id: "test", health: 50, name: "goblin" },
            { id: "test", health: 25, name: "goblin" },
        );
    });

    it("handles added property", () => {
        assertRoundTrip(
            { id: "test", a: 7 },
            { id: "test", a: 7, b: 42 },
        );
    });

    it("handles deleted property", () => {
        assertRoundTrip(
            { id: "test", a: 7, b: 42 },
            { id: "test", a: 7 },
        );
    });

    it("handles nested object change", () => {
        assertRoundTrip(
            { id: "test", pos: { x: 12, y: 8 }, hp: 10 },
            { id: "test", pos: { x: 12, y: 3 }, hp: 10 },
        );
    });

    it("handles deeply nested change", () => {
        assertRoundTrip(
            { id: "test", a: { b: { c: { d: 1, e: 2 } } } },
            { id: "test", a: { b: { c: { d: 99, e: 2 } } } },
        );
    });

    it("handles array append", () => {
        assertRoundTrip(
            { id: "test", items: [10, 20] },
            { id: "test", items: [10, 20, 30, 40] },
        );
    });

    it("handles array truncation", () => {
        assertRoundTrip(
            { id: "test", items: [10, 20, 30, 40, 50] },
            { id: "test", items: [10, 20, 30] },
        );
    });

    it("handles array element modification", () => {
        assertRoundTrip(
            { id: "test", items: [10, 20, 30] },
            { id: "test", items: [10, 99, 30] },
        );
    });

    it("handles array full replacement (>50% changed)", () => {
        assertRoundTrip(
            { id: "test", items: [1, 2, 3, 4] },
            { id: "test", items: [5, 6, 7, 8] },
        );
    });

    it("handles nested objects within arrays", () => {
        assertRoundTrip(
            { id: "test", slots: [{ qty: 5, name: "wood" }, { qty: 10, name: "stone" }] },
            { id: "test", slots: [{ qty: 5, name: "wood" }, { qty: 3, name: "stone" }] },
        );
    });

    it("handles Map key addition and deletion", () => {
        assertRoundTrip(
            { id: "test", data: new Map([["a", 1], ["b", 2]]) },
            { id: "test", data: new Map([["a", 1], ["c", 3]]) },
        );
    });

    it("handles Map value change", () => {
        assertRoundTrip(
            { id: "test", data: new Map([["x", 10]]) },
            { id: "test", data: new Map([["x", 99]]) },
        );
    });

    it("handles Set addition and deletion", () => {
        assertRoundTrip(
            { id: "test", tags: new Set(["alpha", "beta", "gamma"]) },
            { id: "test", tags: new Set(["beta", "delta"]) },
        );
    });

    it("handles mixed changes across multiple fields", () => {
        assertRoundTrip(
            {
                id: "test",
                hp: 100,
                pos: { x: 12, y: 8 },
                inventory: [{ item: "sword", qty: 1 }, { item: "shield", qty: 1 }],
                flags: new Set(["visible", "active"]),
                stats: new Map([["str", 10], ["dex", 8]]),
            },
            {
                id: "test",
                hp: 75,
                pos: { x: 12, y: 14 },
                inventory: [{ item: "sword", qty: 1 }, { item: "shield", qty: 2 }],
                flags: new Set(["visible", "dormant"]),
                stats: new Map([["str", 10], ["dex", 12]]),
            },
        );
    });

    it("handles null to value transition", () => {
        assertRoundTrip(
            { id: "test", target: null },
            { id: "test", target: { x: 5, y: 3 } },
        );
    });

    it("handles value to null transition", () => {
        assertRoundTrip(
            { id: "test", target: { x: 5, y: 3 } },
            { id: "test", target: null },
        );
    });

    it("produces no operations when components are identical", () => {
        const old = { id: "test", val: 7, nested: { a: 1 } } as unknown as Components;
        const updated = { id: "test", val: 7, nested: { a: 1 } } as unknown as Components;
        const ops = diffComponents(old, updated);
        assert.strictEqual(ops.length, 0);
    });
});
