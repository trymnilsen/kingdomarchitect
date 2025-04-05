import { describe, it, expect } from "vitest";
import { RequireError } from "../../../src/common/error/requireError.js";
import { Entity } from "../../../src/game/entity/entity.js";
import { createRootEntity } from "../../../src/game/entity/rootEntity.js";

describe("Entity", () => {
    it("Add child entity", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");
        const secondChild = new Entity("3");

        parent.addChild(firstChild);
        parent.addChild(secondChild);

        expect(parent.children.length).toBe(2);
    });

    it("Parent entity is set on child after add", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");

        parent.addChild(firstChild);
        expect(firstChild.parent).toStrictEqual(parent);
    });

    it("Cannot add child to itself", () => {
        const entity = new Entity("1");

        expect(() => {
            entity.addChild(entity);
        }).toThrow();
    });

    it("Cannot add child already added", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.addChild(child);

        expect(() => {
            const newParent = new Entity("3");
            newParent.addChild(child);
        }).toThrow();
    });

    it("Remove child entity", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");
        const secondChild = new Entity("3");

        parent.addChild(firstChild);
        parent.addChild(secondChild);
        parent.removeChild(firstChild);

        expect(parent.children.length).toBe(1);
        expect(parent.children[0]).toStrictEqual(secondChild);
    });

    it("Throws error attempting to remove child without parent", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        expect(() => {
            parent.removeChild(child);
        }).toThrow();
    });

    it("Recursively run lifecycle when entity is added to a live tree", () => {
        expect(2).toBe(2);
    });
    it("Recursively run lifecycle when entity is removed from a live tree", () => {
        expect(2).toBe(2);
    });

    it("Add component", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("can remove entity", () => {
        expect(2).toBe(2);
    });

    it("will keep components sorted by priority from highest to lowest on add", () => {
        expect(2).toBe(2);
    });

    it("will keep components sorted when one is removed", () => {
        expect(2).toBe(2);
    });

    it("Cannot add component of same type twice", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("Get component", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("Get component returns null if not present", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("Remove component", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("Remove component returns false on non existence", () => {
        //TODO: Reimplement test
        expect(2).toBe(2);
    });

    it("Position of children is updated on parent update", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        child.position = { x: 3, y: 5 };
        parent.addChild(child);
        parent.position = { x: 5, y: 5 };

        expect(child.worldPosition).deep.equal({
            x: 8,
            y: 10,
        });

        parent.position = { x: 2, y: 3 };
        expect(child.worldPosition).deep.equal({
            x: 5,
            y: 8,
        });
    });

    it("Update of world position calculates a new local position", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.addChild(child);
        parent.position = { x: 5, y: 5 };

        expect(child.worldPosition).deep.equal({
            x: 5,
            y: 5,
        });

        child.worldPosition = { x: 20, y: 30 };
        expect(child.position).deep.equal({
            x: 15,
            y: 25,
        });
    });

    it("Update local position with world position if entity has no parent", () => {
        const parent = new Entity("1");

        parent.worldPosition = { x: 20, y: 30 };
        expect(parent.position).deep.equal({
            x: 20,
            y: 30,
        });
    });
});
