import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";

describe("Entity", () => {
    it("Add child entity", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");
        const secondChild = new Entity("3");

        parent.addChild(firstChild);
        parent.addChild(secondChild);

        assert.strictEqual(parent.children.length, 2);
    });

    it("Parent entity is set on child after add", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");

        parent.addChild(firstChild);
        assert.deepStrictEqual(firstChild.parent, parent);
    });

    it("Cannot add child to itself", () => {
        const entity = new Entity("1");

        assert.throws(() => {
            entity.addChild(entity);
        });
    });

    it("Cannot add child already added", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.addChild(child);

        assert.throws(() => {
            const newParent = new Entity("3");
            newParent.addChild(child);
        });
    });

    it("Remove child entity", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");
        const secondChild = new Entity("3");

        parent.addChild(firstChild);
        parent.addChild(secondChild);
        parent.removeChild(firstChild);

        assert.strictEqual(parent.children.length, 1);
        assert.deepStrictEqual(parent.children[0], secondChild);
    });

    it("Throws error attempting to remove child without parent", () => {
        const parent = new Entity("1");
        const child = new Entity("2");
        assert.throws(() => {
            parent.removeChild(child);
        });
    });

    it("Recursively run lifecycle when entity is added to a live tree", () => {
        assert.strictEqual(2, 2);
    });
    it("Recursively run lifecycle when entity is removed from a live tree", () => {
        assert.strictEqual(2, 2);
    });

    it("Add component", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("can remove entity", () => {
        assert.strictEqual(2, 2);
    });

    it("will keep components sorted by priority from highest to lowest on add", () => {
        assert.strictEqual(2, 2);
    });

    it("will keep components sorted when one is removed", () => {
        assert.strictEqual(2, 2);
    });

    it("Cannot add component of same type twice", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("Get component", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("Get component returns null if not present", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("Remove component", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("Remove component returns false on non existence", () => {
        //TODO: Reimplement test
        assert.strictEqual(2, 2);
    });

    it("Position of children is updated on parent update", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        child.position = { x: 3, y: 5 };
        parent.addChild(child);
        parent.position = { x: 5, y: 5 };
        assert.deepStrictEqual(child.worldPosition, {
            x: 8,
            y: 10,
        });

        parent.position = { x: 2, y: 3 };
        assert.deepStrictEqual(child.worldPosition, {
            x: 5,
            y: 8,
        });
    });

    it("Update of world position calculates a new local position", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.addChild(child);
        parent.position = { x: 5, y: 5 };

        assert.deepStrictEqual(child.worldPosition, {
            x: 5,
            y: 5,
        });

        child.worldPosition = { x: 20, y: 30 };
        assert.deepStrictEqual(child.position, {
            x: 15,
            y: 25,
        });
    });

    it("Update local position with world position if entity has no parent", () => {
        const parent = new Entity("1");

        parent.worldPosition = { x: 20, y: 30 };
        assert.deepStrictEqual(parent.position, {
            x: 20,
            y: 30,
        });
    });
});
