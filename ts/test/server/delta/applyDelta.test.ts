import { describe, it } from "node:test";
import assert from "node:assert";
import { applyDelta } from "../../../src/server/delta/applyDelta.ts";
import type { Components } from "../../../src/game/component/component.ts";
import type { DeltaOperation } from "../../../src/server/delta/deltaTypes.ts";

describe("applyDelta", () => {
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
