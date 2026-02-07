import { describe, it } from "node:test";
import assert from "node:assert";
import {
    diffComponent,
    deepEquals,
    isDeltaSmaller,
} from "../../../src/server/delta/diffComponent.ts";
import type { Components } from "../../../src/game/component/component.ts";

describe("diffComponent", () => {
    describe("primitive changes", () => {
        it("detects no change when values are equal", () => {
            const old = { id: "test", value: 5 } as unknown as Components;
            const updated = { id: "test", value: 5 } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 0);
        });

        it("detects primitive value change", () => {
            const old = { id: "test", value: 5 } as unknown as Components;
            const updated = { id: "test", value: 10 } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["value"],
                value: 10,
            });
        });

        it("detects string value change", () => {
            const old = { id: "test", name: "Alice" } as unknown as Components;
            const updated = { id: "test", name: "Bob" } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["name"],
                value: "Bob",
            });
        });

        it("detects added property", () => {
            const old = { id: "test" } as unknown as Components;
            const updated = { id: "test", newField: 42 } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["newField"],
                value: 42,
            });
        });

        it("detects deleted property", () => {
            const old = { id: "test", oldField: 42 } as unknown as Components;
            const updated = { id: "test" } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "delete",
                path: ["oldField"],
            });
        });
    });

    describe("nested object changes", () => {
        it("detects nested value change", () => {
            const old = {
                id: "test",
                nested: { a: 1, b: 2 },
            } as unknown as Components;
            const updated = {
                id: "test",
                nested: { a: 1, b: 3 },
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["nested", "b"],
                value: 3,
            });
        });

        it("detects deeply nested change", () => {
            const old = {
                id: "test",
                a: { b: { c: { d: 1 } } },
            } as unknown as Components;
            const updated = {
                id: "test",
                a: { b: { c: { d: 2 } } },
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["a", "b", "c", "d"],
                value: 2,
            });
        });
    });

    describe("array changes", () => {
        it("detects array append", () => {
            const old = { id: "test", items: [1, 2, 3] } as unknown as Components;
            const updated = { id: "test", items: [1, 2, 3, 4, 5] } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "array_push",
                path: ["items"],
                values: [4, 5],
            });
        });

        it("detects array element change", () => {
            const old = { id: "test", items: [1, 2, 3] } as unknown as Components;
            const updated = { id: "test", items: [1, 99, 3] } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["items", 1],
                value: 99,
            });
        });

        it("detects array truncation", () => {
            const old = { id: "test", items: [1, 2, 3, 4, 5] } as unknown as Components;
            const updated = { id: "test", items: [1, 2, 3] } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "array_splice",
                path: ["items"],
                index: 3,
                deleteCount: 2,
            });
        });

        it("falls back to full replacement for many changes", () => {
            const old = { id: "test", items: [1, 2, 3, 4] } as unknown as Components;
            const updated = { id: "test", items: [5, 6, 7, 8] } as unknown as Components;
            const ops = diffComponent(old, updated);
            // Should fall back to set since all elements changed
            assert.strictEqual(ops.length, 1);
            assert.strictEqual(ops[0].op, "set");
            assert.deepStrictEqual(ops[0].path, ["items"]);
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
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set",
                path: ["items", 1, "qty"],
                value: 15,
            });
        });
    });

    describe("Map changes", () => {
        it("detects Map key addition", () => {
            const old = {
                id: "test",
                data: new Map([["a", 1]]),
            } as unknown as Components;
            const updated = {
                id: "test",
                data: new Map([
                    ["a", 1],
                    ["b", 2],
                ]),
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "map_set",
                path: ["data"],
                key: "b",
                value: 2,
            });
        });

        it("detects Map key deletion", () => {
            const old = {
                id: "test",
                data: new Map([
                    ["a", 1],
                    ["b", 2],
                ]),
            } as unknown as Components;
            const updated = {
                id: "test",
                data: new Map([["a", 1]]),
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "map_delete",
                path: ["data"],
                key: "b",
            });
        });

        it("detects Map value change", () => {
            const old = {
                id: "test",
                data: new Map([["a", 1]]),
            } as unknown as Components;
            const updated = {
                id: "test",
                data: new Map([["a", 99]]),
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "map_set",
                path: ["data"],
                key: "a",
                value: 99,
            });
        });
    });

    describe("Set changes", () => {
        it("detects Set value addition", () => {
            const old = {
                id: "test",
                tags: new Set(["a", "b"]),
            } as unknown as Components;
            const updated = {
                id: "test",
                tags: new Set(["a", "b", "c"]),
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set_add",
                path: ["tags"],
                value: "c",
            });
        });

        it("detects Set value deletion", () => {
            const old = {
                id: "test",
                tags: new Set(["a", "b", "c"]),
            } as unknown as Components;
            const updated = {
                id: "test",
                tags: new Set(["a", "c"]),
            } as unknown as Components;
            const ops = diffComponent(old, updated);
            assert.strictEqual(ops.length, 1);
            assert.deepStrictEqual(ops[0], {
                op: "set_delete",
                path: ["tags"],
                value: "b",
            });
        });
    });
});

describe("deepEquals", () => {
    it("returns true for equal primitives", () => {
        assert.strictEqual(deepEquals(1, 1), true);
        assert.strictEqual(deepEquals("a", "a"), true);
        assert.strictEqual(deepEquals(true, true), true);
        assert.strictEqual(deepEquals(null, null), true);
        assert.strictEqual(deepEquals(undefined, undefined), true);
    });

    it("returns false for different primitives", () => {
        assert.strictEqual(deepEquals(1, 2), false);
        assert.strictEqual(deepEquals("a", "b"), false);
        assert.strictEqual(deepEquals(true, false), false);
        assert.strictEqual(deepEquals(null, undefined), false);
    });

    it("returns true for equal objects", () => {
        assert.strictEqual(deepEquals({ a: 1 }, { a: 1 }), true);
        assert.strictEqual(
            deepEquals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }),
            true,
        );
    });

    it("returns false for different objects", () => {
        assert.strictEqual(deepEquals({ a: 1 }, { a: 2 }), false);
        assert.strictEqual(deepEquals({ a: 1 }, { b: 1 }), false);
    });

    it("returns true for equal arrays", () => {
        assert.strictEqual(deepEquals([1, 2, 3], [1, 2, 3]), true);
        assert.strictEqual(deepEquals([[1], [2]], [[1], [2]]), true);
    });

    it("returns false for different arrays", () => {
        assert.strictEqual(deepEquals([1, 2], [1, 2, 3]), false);
        assert.strictEqual(deepEquals([1, 2], [1, 3]), false);
    });

    it("returns true for equal Maps", () => {
        assert.strictEqual(
            deepEquals(new Map([["a", 1]]), new Map([["a", 1]])),
            true,
        );
    });

    it("returns false for different Maps", () => {
        assert.strictEqual(
            deepEquals(new Map([["a", 1]]), new Map([["a", 2]])),
            false,
        );
    });

    it("returns true for equal Sets", () => {
        assert.strictEqual(
            deepEquals(new Set([1, 2, 3]), new Set([1, 2, 3])),
            true,
        );
    });

    it("returns false for different Sets", () => {
        assert.strictEqual(
            deepEquals(new Set([1, 2]), new Set([1, 2, 3])),
            false,
        );
    });
});

describe("isDeltaSmaller", () => {
    it("returns true when delta is smaller", () => {
        const ops = [{ op: "set" as const, path: ["x"], value: 1 }];
        // Component with lots of data - delta should be much smaller
        const component = {
            id: "test",
            items: [
                { id: 1, name: "item1", quantity: 10, description: "first item" },
                { id: 2, name: "item2", quantity: 20, description: "second item" },
                { id: 3, name: "item3", quantity: 30, description: "third item" },
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
});
