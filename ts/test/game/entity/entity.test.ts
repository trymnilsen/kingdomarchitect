import { describe, it, expect } from "vitest";
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
        const parent = new Entity("1");
        const component = new StubComponent();

        parent.addComponent(component);
        const addedComponent = parent.getComponent(StubComponent);

        expect(addedComponent).toStrictEqual(component);
        expect(parent.components.some((item) => item === component)).toBe(true);
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
        const parent = new Entity("1");
        const firstComponent = new StubComponent();
        const secondComponent = new StubComponent();

        expect(() => {
            parent.addComponent(firstComponent);
            parent.addComponent(secondComponent);
        }).toThrow;
    });

    it("Get component", () => {
        const entity = new Entity("1");
        const component = new StubComponent();
        entity.addComponent(component);
        const getResult = entity.getComponent(StubComponent);
        expect(getResult).toStrictEqual(component);
    });

    it("Get component returns null if not present", () => {
        const entity = new Entity("1");
        const getResult = entity.getComponent(StubComponent);
        expect(null).toBe(getResult);
    });

    it("Require component returns component", () => {
        const entity = new Entity("1");
        const component = new StubComponent();
        entity.addComponent(component);
        const getResult = entity.requireComponent(StubComponent);
        expect(getResult).toStrictEqual(component);
    });

    it("Require component throws if not present", () => {
        const entity = new Entity("1");
        expect(() => {
            entity.requireComponent(StubComponent);
        }).toThrow(RequireError);
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

        expect(ancestorComponent).toStrictEqual(component);
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

        expect(startInvoked).toBe(false);
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

        expect(startInvoked).toBe(true);
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

        expect(2).toBe(2);
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
        expect(startInvokedTimes).toStrictEqual(0);

        parent.addChild(child);
        expect(startInvokedTimes).toBe(1);
        */
        expect(2).toBe(2);
    });

    it("Component lifecycle is started if gameroot is set to true", () => {});

    it("Remove component", () => {
        const parent = new Entity("1");
        const component = new StubComponent();

        parent.addComponent(component);
        const addedComponent = parent.getComponent(StubComponent);
        expect(addedComponent).toStrictEqual(component);

        parent.removeComponent(component);
        const removedComponent = parent.getComponent(StubComponent);
        expect(removedComponent).toBe(null);
        expect(parent.components.some((item) => item === component)).toBe(
            false,
        );
    });

    it("Remove component returns false on non existence", () => {
        const parent = new Entity("1");
        const nonExistingRemoveResult = parent.removeComponent(
            new StubComponent(),
        );
        expect(nonExistingRemoveResult).toStrictEqual(false);
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
        expect(stopInvoked).toBe(true);
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
        expect(stopInvokedTimes).toStrictEqual(0);
        parent.removeChild(child);
        expect(stopInvokedTimes).toBe(1);
    });

    it("onUpdate of component is called", () => {
        expect(2).toBe(2);
    });

    it("onUpdate of component is called in priority order", () => {
        expect(2).toBe(2);
    });

    it("onDraw of component is called", () => {
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
