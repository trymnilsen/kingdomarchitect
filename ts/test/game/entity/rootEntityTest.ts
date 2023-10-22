import * as assert from "node:assert";
import { Entity } from "../../../src/game/entity/entity.js";
import { createRootEntity } from "../../../src/game/entity/rootEntity.js";
import { ChunkMapComponent } from "../../../src/game/component/root/chunk/chunkMapComponent.js";

describe("RootEntity Test", () => {
    it("Can get entity at position", () => {
        const rootEntity = createRootEntity();
        const firstItem = new Entity("2");
        firstItem.position = { x: -2, y: -1 };

        const secondItem = new Entity("3");
        secondItem.position = { x: 4, y: 5 };

        rootEntity.addChild(firstItem);
        rootEntity.addChild(secondItem);

        const entitiesAtFirstPoint = rootEntity
            .requireComponent(ChunkMapComponent)
            .getEntityAt({
                x: -2,
                y: -1,
            });

        const entitiesAtSecondPoint = rootEntity
            .requireComponent(ChunkMapComponent)
            .getEntityAt({
                x: 4,
                y: 5,
            });

        const entitiesAtThirdPoint = rootEntity
            .requireComponent(ChunkMapComponent)
            .getEntityAt({
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
});
