import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";

describe("Entity", () => {
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
});
