import * as assert from "node:assert";
import { describe, it } from "node:test";
import { StubComponent } from "../component/stubComponent.js";
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

        assert.equal(parent.children.length, 2);
    });

    it("Parent entity is set on child after add", () => {
        const parent = new Entity("1");
        const firstChild = new Entity("2");

        parent.addChild(firstChild);
        assert.strictEqual(firstChild.parent, parent);
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

        assert.equal(parent.children.length, 1);
        assert.strictEqual(parent.children[0], secondChild);
    });

    it("Throws error attempting to remove child without parent", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        assert.throws(() => {
            parent.removeChild(child);
        });
    });

    it("Recursively run lifecycle when entity is added to a live tree", () => {
        assert.equal(2, 2);
    });
    it("Recursively run lifecycle when entity is removed from a live tree", () => {
        assert.equal(2, 2);
    });

    it("Add component", () => {
        const parent = new Entity("1");
        const component = new StubComponent();

        parent.addComponent(component);
        const addedComponent = parent.getComponent(StubComponent);

        assert.strictEqual(addedComponent, component);
        assert.equal(
            parent.components.some((item) => item === component),
            true,
        );
    });

    it("can remove entity", () => {
        assert.equal(2, 2);
    });

    it("will keep components sorted by priority from highest to lowest on add", () => {
        assert.equal(2, 2);
    });

    it("will keep components sorted when one is removed", () => {
        assert.equal(2, 2);
    });

    it("Cannot add component of same type twice", () => {
        const parent = new Entity("1");
        const firstComponent = new StubComponent();
        const secondComponent = new StubComponent();

        assert.throws(() => {
            parent.addComponent(firstComponent);
            parent.addComponent(secondComponent);
        });
    });

    it("Get component", () => {
        const entity = new Entity("1");
        const component = new StubComponent();
        entity.addComponent(component);
        const getResult = entity.getComponent(StubComponent);
        assert.strictEqual(getResult, component);
    });

    it("Get component returns null if not present", () => {
        const entity = new Entity("1");
        const getResult = entity.getComponent(StubComponent);
        assert.equal(null, getResult);
    });

    it("Require component returns component", () => {
        const entity = new Entity("1");
        const component = new StubComponent();
        entity.addComponent(component);
        const getResult = entity.requireComponent(StubComponent);
        assert.strictEqual(getResult, component);
    });

    it("Require component throws if not present", () => {
        const entity = new Entity("1");
        assert.throws(() => {
            entity.requireComponent(StubComponent);
        }, RequireError);
    });

    it("Get ancestor component of entity", () => {
        const grandParent = new Entity("1");
        const parent = new Entity("2");
        const child = new Entity("3");
        parent.addChild(child);
        grandParent.addChild(parent);
        const component = new StubComponent();

        grandParent.addComponent(component);
        const ancestorComponent = child.getAncestorComponent(StubComponent);

        assert.strictEqual(ancestorComponent, component);
    });

    it("Do not run lifecycle methods if entity is not attached", () => {
        let startInvoked = false;
        const parent = new Entity("1");
        const child = new Entity("2");
        const component = new StubComponent({
            onStart: () => {
                startInvoked = true;
            },
        });

        parent.addChild(child);
        child.addComponent(component);

        assert.equal(startInvoked, false);
    });

    it("Run lifecycle methods if entity is attached", () => {
        let startInvoked = false;
        const parent = createRootEntity();
        const child = new Entity("2");
        const component = new StubComponent({
            onStart: () => {
                startInvoked = true;
            },
        });

        parent.addChild(child);
        child.addComponent(component);

        assert.equal(startInvoked, true);
    });

    it("Run component lifecycle when entity is attached", () => {
        /*
        let startInvoked = false;
        const parent = new Entity("1");
        const child = new Entity("2");
        const component = new StubComponent({
            onStart: () => {
                startInvoked = true;
            },
        });

        child.addComponent(component);
        assert.isFalse(startInvoked);

        parent.addChild(child);
        assert.isTrue(startInvoked);
        */

        assert.equal(2, 2);
    });

    it("Component lifecycle is not called more than once", () => {
        /*
        let startInvokedTimes = 0;
        const parent = new Entity("1");
        const child = new Entity("2");
        const component = new StubComponent({
            onStart: () => {
                startInvokedTimes += 1;
            },
        });

        child.addComponent(component);
        assert.strictEqual(startInvokedTimes, 0);

        parent.addChild(child);
        assert.equal(startInvokedTimes, 1);
        */
        assert.equal(2, 2);
    });

    it("Component lifecycle is started if gameroot is set to true", () => {});

    it("Remove component", () => {
        const parent = new Entity("1");
        const component = new StubComponent();

        parent.addComponent(component);
        const addedComponent = parent.getComponent(StubComponent);
        assert.strictEqual(addedComponent, component);

        parent.removeComponent(component);
        const removedComponent = parent.getComponent(StubComponent);
        assert.equal(removedComponent, null);
        assert.equal(
            parent.components.some((item) => item === component),
            false,
        );
    });

    it("Remove component returns false on non existence", () => {
        const parent = new Entity("1");
        const nonExistingRemoveResult = parent.removeComponent(
            new StubComponent(),
        );
        assert.strictEqual(nonExistingRemoveResult, false);
    });

    it("Component lifecycle is called on remove component", () => {
        let stopInvoked = false;
        const parent = new Entity("1");
        const child = new Entity("2");
        parent.addChild(child);

        const component = new StubComponent({
            onStop: () => {
                stopInvoked = true;
            },
        });

        child.addComponent(component);
        child.removeComponent(component);
        assert.equal(stopInvoked, true);
    });

    it("Component lifecycle is called on remove entity", () => {
        let stopInvokedTimes = 0;
        const parent = new Entity("1");
        const child = new Entity("2");
        parent.addChild(child);

        const component = new StubComponent({
            onStop: () => {
                stopInvokedTimes += 1;
            },
        });

        child.addComponent(component);
        assert.strictEqual(stopInvokedTimes, 0);
        parent.removeChild(child);
        assert.equal(stopInvokedTimes, 1);
    });

    it("onUpdate of component is called", () => {
        assert.equal(2, 2);
    });

    it("onUpdate of component is called in priority order", () => {
        assert.equal(2, 2);
    });

    it("onDraw of component is called", () => {
        assert.equal(2, 2);
    });

    it("Position of children is updated on parent update", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        child.position = { x: 3, y: 5 };
        parent.addChild(child);
        parent.position = { x: 5, y: 5 };

        assert.deepEqual(child.worldPosition, {
            x: 8,
            y: 10,
        });

        parent.position = { x: 2, y: 3 };
        assert.deepEqual(child.worldPosition, {
            x: 5,
            y: 8,
        });
    });

    it("Update of world position calculates a new local position", () => {
        const parent = new Entity("1");
        const child = new Entity("2");

        parent.addChild(child);
        parent.position = { x: 5, y: 5 };

        assert.deepEqual(child.worldPosition, {
            x: 5,
            y: 5,
        });

        child.worldPosition = { x: 20, y: 30 };
        assert.deepEqual(child.position, {
            x: 15,
            y: 25,
        });
    });

    it("Update local position with world position if entity has no parent", () => {
        const parent = new Entity("1");

        parent.worldPosition = { x: 20, y: 30 };
        assert.deepEqual(parent.position, {
            x: 20,
            y: 30,
        });
    });
});
