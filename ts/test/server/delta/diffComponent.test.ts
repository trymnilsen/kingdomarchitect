import { describe, it } from "node:test";
import assert from "node:assert";
import {
    diffComponents,
    deepEquals,
    isDeltaSmaller,
} from "../../../src/server/delta/diffComponent.ts";
import type { Components } from "../../../src/game/component/component.ts";

describe("diffComponents", () => {
    describe("array changes", () => {
        it("detects array append", () => {
            const old = {
                id: "test",
                items: [1, 2, 3],
            } as unknown as Components;
            const updated = {
                id: "test",
                items: [1, 2, 3, 4, 5],
            } as unknown as Components;
            const ops = diffComponents(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "array_push",
                path: ["items"],
                values: [4, 5],
            });
        });

        it("diffs nested objects in arrays", () => {
            const old = {
                id: "test",
                items: [{ qty: 5 }, { qty: 10 }],
            } as unknown as Components;
            const updated = {
                id: "test",
                items: [{ qty: 5 }, { qty: 15 }],
            } as unknown as Components;
            const ops = diffComponents(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["items", 1, "qty"],
                value: 15,
            });
        });
    });
});

describe("deepEquals", () => {
    it("returns false for different primitives", () => {
        assert.strictEqual(deepEquals(1, 2), false);
        assert.strictEqual(deepEquals("a", "b"), false);
        assert.strictEqual(deepEquals(true, false), false);
        assert.strictEqual(deepEquals(null, undefined), false);
    });

    it("returns false for different objects", () => {
        assert.strictEqual(deepEquals({ a: 1 }, { a: 2 }), false);
        assert.strictEqual(deepEquals({ a: 1 }, { b: 1 }), false);
    });

    it("returns false for different arrays", () => {
        assert.strictEqual(deepEquals([1, 2], [1, 2, 3]), false);
        assert.strictEqual(deepEquals([1, 2], [1, 3]), false);
    });

    it("returns false for different Maps", () => {
        assert.strictEqual(
            deepEquals(new Map([["a", 1]]), new Map([["a", 2]])),
            false,
        );
    });

    it("returns false for different Sets", () => {
        assert.strictEqual(
            deepEquals(new Set([1, 2]), new Set([1, 2, 3])),
            false,
        );
    });
});

describe("diffComponents array threshold boundary", () => {
    it("does not fall back to full replacement at exactly 50% changes", () => {
        // 2 out of 4 elements changed = 50%, threshold is > 50% so no fallback
        const old = {
            id: "test",
            items: [1, 2, 3, 4],
        } as unknown as Components;
        const updated = {
            id: "test",
            items: [99, 2, 88, 4],
        } as unknown as Components;
        const ops = diffComponents(old, updated);
        // Should produce per-element set ops, not a single full replacement
        assert.strictEqual(ops.length, 2);
        assert.strictEqual(ops[0].op, "set");
        assert.deepStrictEqual(ops[0].path, ["items", 0]);
        assert.strictEqual(ops[1].op, "set");
        assert.deepStrictEqual(ops[1].path, ["items", 2]);
    });

    it("falls back to full replacement when over 50% changed", () => {
        // 3 out of 4 elements changed = 75%, should fall back
        const old = {
            id: "test",
            items: [1, 2, 3, 4],
        } as unknown as Components;
        const updated = {
            id: "test",
            items: [99, 88, 77, 4],
        } as unknown as Components;
        const ops = diffComponents(old, updated);
        assert.strictEqual(ops.length, 1);
        assert.strictEqual(ops[0].op, "set");
        assert.deepStrictEqual(ops[0].path, ["items"]);
    });
});

describe("isDeltaSmaller", () => {
    it("returns true when delta is smaller", () => {
        const ops = [{ op: "set" as const, path: ["x"], value: 1 }];
        // Component with lots of data - delta should be much smaller
        const component = {
            id: "test",
            items: [
                {
                    id: 1,
                    name: "item1",
                    quantity: 10,
                    description: "first item",
                },
                {
                    id: 2,
                    name: "item2",
                    quantity: 20,
                    description: "second item",
                },
                {
                    id: 3,
                    name: "item3",
                    quantity: 30,
                    description: "third item",
                },
            ],
            metadata: {
                created: "2024-01-01",
                updated: "2024-01-02",
                version: 5,
            },
        } as unknown as Components;
        assert.strictEqual(isDeltaSmaller(ops, component), true);
    });

    it("returns false when delta is larger", () => {
        const ops = [
            { op: "set" as const, path: ["a"], value: 1 },
            { op: "set" as const, path: ["b"], value: 2 },
            { op: "set" as const, path: ["c"], value: 3 },
            { op: "set" as const, path: ["d"], value: 4 },
            { op: "set" as const, path: ["e"], value: 5 },
        ];
        const component = { id: "test", x: 1 } as unknown as Components;
        assert.strictEqual(isDeltaSmaller(ops, component), false);
    });

    it("returns false for small components regardless of delta size", () => {
        // Even a tiny delta should not be used for a small component
        const ops = [
            { op: "set" as const, path: ["direction"], value: "down" },
        ];
        const component = {
            id: "Direction",
            direction: "down",
            ordinal: "southeast",
        } as unknown as Components;
        assert.strictEqual(isDeltaSmaller(ops, component), false);
    });
});
