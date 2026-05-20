import assert from "node:assert";
import { describe, it } from "node:test";
import { reconcileQueue } from "../../../../src/game/behavior/systems/BehaviorSystem.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";

describe("reconcileQueue", () => {
    it("preserves the running head reference when shapes match", () => {
        // headA and headAClone deep-equal each other but are distinct
        // object identities. The contract under test: reconcile must
        // keep headA (the running action), not headAClone — that's
        // what carries any in-progress state across replans.
        const headA: BehaviorActionData = { type: "wait", until: 100 };
        const tailB: BehaviorActionData = { type: "wait", until: 200 };
        const headAClone: BehaviorActionData = { type: "wait", until: 100 };
        const tailC: BehaviorActionData = { type: "wait", until: 300 };

        const current = [headA, tailB];
        const next = [headAClone, tailC];

        const result = reconcileQueue(current, next);

        assert.strictEqual(result.length, 2);
        assert.strictEqual(
            result[0],
            headA,
            "head must be the running reference from current, not the clone from next",
        );
        assert.strictEqual(
            result[1],
            tailC,
            "tail must come from the new plan",
        );
    });

    it("returns the new queue when heads differ", () => {
        const current: BehaviorActionData[] = [
            { type: "wait", until: 100 },
        ];
        const next: BehaviorActionData[] = [
            { type: "wait", until: 999 },
        ];

        const result = reconcileQueue(current, next);

        assert.deepStrictEqual(result, next);
    });

    it("adopts the new queue when current is empty", () => {
        const a: BehaviorActionData = { type: "wait", until: 100 };
        const b: BehaviorActionData = { type: "wait", until: 200 };

        const result = reconcileQueue([], [a, b]);

        assert.deepStrictEqual(result, [a, b]);
    });

    it("returns empty when next is empty", () => {
        const a: BehaviorActionData = { type: "wait", until: 100 };
        const b: BehaviorActionData = { type: "wait", until: 200 };

        const result = reconcileQueue([a, b], []);

        assert.deepStrictEqual(result, []);
    });

    it("returns empty when both are empty", () => {
        const result = reconcileQueue([], []);

        assert.deepStrictEqual(result, []);
    });

    it("preserves the head with no tail for matching single-element queues", () => {
        const headA: BehaviorActionData = { type: "wait", until: 100 };
        const headAClone: BehaviorActionData = { type: "wait", until: 100 };

        const result = reconcileQueue([headA], [headAClone]);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(
            result[0],
            headA,
            "head must be the running reference, not the clone",
        );
    });

    it("returns the new head for differing single-element queues", () => {
        const headA: BehaviorActionData = { type: "wait", until: 100 };
        const headB: BehaviorActionData = { type: "wait", until: 200 };

        const result = reconcileQueue([headA], [headB]);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], headB);
    });

    it("keeps the running head while taking a longer tail from next", () => {
        const headA: BehaviorActionData = { type: "wait", until: 100 };
        const tailB: BehaviorActionData = { type: "wait", until: 200 };
        const headAClone: BehaviorActionData = { type: "wait", until: 100 };
        const tailC: BehaviorActionData = { type: "wait", until: 300 };
        const tailD: BehaviorActionData = { type: "wait", until: 400 };

        const result = reconcileQueue([headA, tailB], [headAClone, tailC, tailD]);

        assert.strictEqual(result.length, 3);
        assert.strictEqual(
            result[0],
            headA,
            "head must be the running reference from current",
        );
        assert.strictEqual(result[1], tailC);
        assert.strictEqual(result[2], tailD);
    });
});
