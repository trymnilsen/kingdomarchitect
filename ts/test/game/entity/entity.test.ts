import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";

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

    it("Component added to a descendant shows up in an already-built root query", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        root.addChild(child);

        assert.strictEqual(root.queryComponents(HealthComponentId).size, 0);

        child.setEcsComponent(createHealthComponent(10, 10));

        const query = root.queryComponents(HealthComponentId);
        assert.strictEqual(query.size, 1);
        assert.strictEqual(query.get(child)?.currentHp, 10);
    });

    it("Replacing a component replaces it in the root query", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        root.addChild(child);

        child.setEcsComponent(createHealthComponent(10, 10));
        root.queryComponents(HealthComponentId);
        child.setEcsComponent(createHealthComponent(4, 10));

        const query = root.queryComponents(HealthComponentId);
        assert.strictEqual(query.size, 1);
        assert.strictEqual(query.get(child)?.currentHp, 4);
    });

    it("Removing a component drops it from the root query", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        root.addChild(child);

        child.setEcsComponent(createHealthComponent(10, 10));
        root.queryComponents(HealthComponentId);
        child.removeEcsComponent(HealthComponentId);

        assert.strictEqual(root.queryComponents(HealthComponentId).size, 0);
    });

    it("Removing an entity drops its whole subtree from the root query", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        const grandchild = new Entity("3");

        root.addChild(child);
        child.addChild(grandchild);
        child.setEcsComponent(createHealthComponent(10, 10));
        grandchild.setEcsComponent(createHealthComponent(7, 7));
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 2);

        child.remove();

        assert.strictEqual(root.queryComponents(HealthComponentId).size, 0);
        assert.strictEqual(root.children.length, 0);
    });

    it("Attaching a subtree registers the components it already carries", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        const grandchild = new Entity("3");

        child.addChild(grandchild);
        grandchild.setEcsComponent(createHealthComponent(7, 7));
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 0);

        root.addChild(child);

        const query = root.queryComponents(HealthComponentId);
        assert.strictEqual(query.size, 1);
        assert.strictEqual(query.get(grandchild)?.currentHp, 7);
    });

    it("Ancestor lookup finds the nearest holder of a component", () => {
        const root = new Entity("1");
        const child = new Entity("2");
        const grandchild = new Entity("3");

        root.addChild(child);
        child.addChild(grandchild);
        root.setEcsComponent(createHealthComponent(100, 100));
        child.setEcsComponent(createHealthComponent(20, 20));

        assert.strictEqual(
            grandchild.getAncestorEcsComponent(HealthComponentId)?.maxHp,
            20,
        );
        assert.strictEqual(
            grandchild.getAncestorEntity(HealthComponentId),
            child,
        );
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

    it("Add child to positioned parent preserves the child's world position", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.position = { x: 4, y: 4 };
        child.worldPosition = { x: 7, y: 2 };
        parent.addChild(child);

        assert.deepStrictEqual(child.worldPosition, { x: 7, y: 2 });
        assert.deepStrictEqual(child.position, { x: 3, y: -2 });
    });

    it("Add child does not change the parent's position", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.position = { x: 4, y: 4 };
        parent.addChild(child);

        assert.deepStrictEqual(parent.position, { x: 4, y: 4 });
        assert.deepStrictEqual(parent.worldPosition, { x: 4, y: 4 });
    });

    it("Set local position after add places child relative to parent", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.position = { x: 4, y: 4 };
        parent.addChild(child);
        child.position = { x: 0, y: 0 };

        assert.deepStrictEqual(child.worldPosition, { x: 4, y: 4 });
    });

    it("Add child updates the transforms of the child's subtree", () => {
        const parent = new Entity("1");
        const child = new Entity("2");
        const grandchild = new Entity("3");

        child.addChild(grandchild);
        grandchild.position = { x: 1, y: 1 };
        child.worldPosition = { x: 2, y: 2 };

        parent.position = { x: 4, y: 4 };
        parent.addChild(child);

        assert.deepStrictEqual(child.worldPosition, { x: 2, y: 2 });
        assert.deepStrictEqual(grandchild.worldPosition, { x: 3, y: 3 });
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
