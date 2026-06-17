import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";

describe("Entity.findEntity", () => {
    it("finds a nested descendant by id", () => {
        const root = new Entity("root");
        const child = new Entity("child");
        const grandchild = new Entity("grandchild");
        child.addChild(grandchild);
        root.addChild(child);

        assert.strictEqual(root.findEntity("grandchild"), grandchild);
    });

    it("returns null for an unknown id", () => {
        const root = new Entity("root");
        root.addChild(new Entity("child"));

        assert.strictEqual(root.findEntity("nope"), null);
    });

    it("finds an entity added after the cache was first built", () => {
        const root = new Entity("root");
        // Prime the cache with a miss so it exists and could go stale.
        assert.strictEqual(root.findEntity("late"), null);

        const late = new Entity("late");
        root.addChild(late);

        // child_added must have invalidated the id cache.
        assert.strictEqual(root.findEntity("late"), late);
    });

    it("stops finding an entity after it is removed", () => {
        const root = new Entity("root");
        const child = new Entity("child");
        root.addChild(child);
        // Prime the cache with a hit.
        assert.strictEqual(root.findEntity("child"), child);

        root.removeChild(child);

        // child_removed must have invalidated the id cache, and the lazy
        // rebuild must not re-include the now-detached child.
        assert.strictEqual(root.findEntity("child"), null);
    });

    it("returns the same instance on repeated lookups", () => {
        const root = new Entity("root");
        const child = new Entity("child");
        root.addChild(child);

        assert.strictEqual(root.findEntity("child"), root.findEntity("child"));
    });
});
