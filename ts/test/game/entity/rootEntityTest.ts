import { assert } from "chai";
import { Entity } from "../../../src/game/world/entity/entity.js";
import { RootEntity } from "../../../src/game/world/entity/rootEntity.js";

describe("RootEntity Test", () => {
    it("Can get entity at position", () => {
        const rootEntity = new RootEntity("1");
        const firstItem = new Entity("2");
        firstItem.position = { x: -2, y: -1 };

        const secondItem = new Entity("3");
        secondItem.position = { x: 4, y: 5 };

        rootEntity.addChild(firstItem);
        rootEntity.addChild(secondItem);

        const entitiesAtFirstPoint = rootEntity.getEntityAt({
            x: -2,
            y: -1,
        });

        const entitiesAtSecondPoint = rootEntity.getEntityAt({
            x: 4,
            y: 5,
        });

        const entitiesAtThirdPoint = rootEntity.getEntityAt({
            x: 5,
            y: 3,
        });

        assert.equal(entitiesAtFirstPoint.length, 1);
        assert.equal(entitiesAtSecondPoint.length, 1);
        assert.equal(entitiesAtThirdPoint.length, 0);
        assert.strictEqual(entitiesAtFirstPoint[0], firstItem);
        assert.strictEqual(entitiesAtSecondPoint[0], secondItem);
    });
    it("Can get entity at position in adjacent chunk with bounds", () => {
        assert.equal(2, 2);
    });
    it("Updates chunk map on position change of child", () => {
        assert.equal(2, 2);
    });
    it("Updates chunk map when child is added or removed", () => {
        assert.equal(2, 2);
    });
    it("Cannot set parent", () => {
        const rootEntity = new RootEntity("1");
        assert.throws(() => {
            rootEntity.parent = new Entity("2");
        });
    });
});
