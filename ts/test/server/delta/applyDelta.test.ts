import { describe, it } from "node:test";
import assert from "node:assert";
import { applyDelta } from "../../../src/server/delta/applyDelta.ts";
import type { Components } from "../../../src/game/component/component.ts";
import type { DeltaOperation } from "../../../src/server/delta/deltaTypes.ts";

describe("applyDelta", () => {
    describe("set operation", () => {
        it("sets a primitive value", () => {
            const component = { id: "test", value: 5 } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["value"], value: 10 },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).value, 10);
        });

        it("sets a nested value", () => {
            const component = {
                id: "test",
                nested: { a: 1, b: 2 },
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["nested", "b"], value: 99 },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).nested.b, 99);
        });

        it("sets a deeply nested value", () => {
            const component = {
                id: "test",
                a: { b: { c: { d: 1 } } },
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["a", "b", "c", "d"], value: 42 },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).a.b.c.d, 42);
        });

        it("adds a new property", () => {
            const component = { id: "test" } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["newField"], value: "hello" },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).newField, "hello");
        });

        it("sets an array element", () => {
            const component = { id: "test", items: [1, 2, 3] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["items", 1], value: 99 },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 99, 3]);
        });

        it("replaces entire array", () => {
            const component = { id: "test", items: [1, 2, 3] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["items"], value: [4, 5, 6] },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [4, 5, 6]);
        });
    });

    describe("delete operation", () => {
        it("deletes a property", () => {
            const component = { id: "test", toDelete: 42 } as unknown as Components;
            const ops: DeltaOperation[] = [{ op: "delete", path: ["toDelete"] }];
            applyDelta(component, ops);
            assert.strictEqual((component as any).toDelete, undefined);
            assert.strictEqual("toDelete" in component, false);
        });

        it("deletes a nested property", () => {
            const component = {
                id: "test",
                nested: { a: 1, b: 2 },
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "delete", path: ["nested", "b"] },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).nested, { a: 1 });
        });
    });

    describe("array_push operation", () => {
        it("pushes single value", () => {
            const component = { id: "test", items: [1, 2] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "array_push", path: ["items"], values: [3] },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 2, 3]);
        });

        it("pushes multiple values", () => {
            const component = { id: "test", items: [1] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "array_push", path: ["items"], values: [2, 3, 4] },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 2, 3, 4]);
        });

        it("pushes to nested array", () => {
            const component = {
                id: "test",
                nested: { arr: [1] },
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "array_push", path: ["nested", "arr"], values: [2, 3] },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).nested.arr, [1, 2, 3]);
        });
    });

    describe("array_splice operation", () => {
        it("removes elements from end", () => {
            const component = { id: "test", items: [1, 2, 3, 4, 5] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "array_splice", path: ["items"], index: 3, deleteCount: 2 },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 2, 3]);
        });

        it("removes element from middle", () => {
            const component = { id: "test", items: [1, 2, 3, 4] } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "array_splice", path: ["items"], index: 1, deleteCount: 1 },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 3, 4]);
        });

        it("inserts elements", () => {
            const component = { id: "test", items: [1, 4] } as unknown as Components;
            const ops: DeltaOperation[] = [
                {
                    op: "array_splice",
                    path: ["items"],
                    index: 1,
                    deleteCount: 0,
                    insert: [2, 3],
                },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 2, 3, 4]);
        });

        it("replaces elements", () => {
            const component = { id: "test", items: [1, 2, 3, 4] } as unknown as Components;
            const ops: DeltaOperation[] = [
                {
                    op: "array_splice",
                    path: ["items"],
                    index: 1,
                    deleteCount: 2,
                    insert: [99],
                },
            ];
            applyDelta(component, ops);
            assert.deepStrictEqual((component as any).items, [1, 99, 4]);
        });
    });

    describe("map operations", () => {
        it("sets a Map key", () => {
            const component = {
                id: "test",
                data: new Map([["a", 1]]),
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "map_set", path: ["data"], key: "b", value: 2 },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).data.get("b"), 2);
        });

        it("updates a Map value", () => {
            const component = {
                id: "test",
                data: new Map([["a", 1]]),
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "map_set", path: ["data"], key: "a", value: 99 },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).data.get("a"), 99);
        });

        it("deletes a Map key", () => {
            const component = {
                id: "test",
                data: new Map([
                    ["a", 1],
                    ["b", 2],
                ]),
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "map_delete", path: ["data"], key: "b" },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).data.has("b"), false);
            assert.strictEqual((component as any).data.size, 1);
        });
    });

    describe("set operations", () => {
        it("adds a value to Set", () => {
            const component = {
                id: "test",
                tags: new Set(["a", "b"]),
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set_add", path: ["tags"], value: "c" },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).tags.has("c"), true);
            assert.strictEqual((component as any).tags.size, 3);
        });

        it("removes a value from Set", () => {
            const component = {
                id: "test",
                tags: new Set(["a", "b", "c"]),
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set_delete", path: ["tags"], value: "b" },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).tags.has("b"), false);
            assert.strictEqual((component as any).tags.size, 2);
        });
    });

    describe("multiple operations", () => {
        it("applies multiple operations in order", () => {
            const component = {
                id: "test",
                a: 1,
                b: 2,
                items: [1, 2],
            } as unknown as Components;
            const ops: DeltaOperation[] = [
                { op: "set", path: ["a"], value: 10 },
                { op: "delete", path: ["b"] },
                { op: "array_push", path: ["items"], values: [3, 4] },
            ];
            applyDelta(component, ops);
            assert.strictEqual((component as any).a, 10);
            assert.strictEqual("b" in component, false);
            assert.deepStrictEqual((component as any).items, [1, 2, 3, 4]);
        });
    });
});
