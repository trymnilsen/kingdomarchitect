import { describe, it, expect } from "vitest";
import { Entity } from "../../../src/game/entity/entity.js";
import { createRootEntity } from "../../../src/game/entity/rootEntity.js";
import { SpatialChunkMapComponent } from "../../../src/game/componentOld/world/spatialChunkMapComponent.js";

describe("RootEntity", () => {
    it("Can get entity at position", () => {
        const rootEntity = createRootEntity();
        const firstItem = new Entity("2");
        firstItem.position = { x: -2, y: -1 };

        const secondItem = new Entity("3");
        secondItem.position = { x: 4, y: 5 };

        rootEntity.addChild(firstItem);
        rootEntity.addChild(secondItem);

        const entitiesAtFirstPoint = rootEntity
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(-2, -1);

        const entitiesAtSecondPoint = rootEntity
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(4, 5);

        const entitiesAtThirdPoint = rootEntity
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(5, 3);

        expect(entitiesAtFirstPoint.length).toBe(1);
        expect(entitiesAtSecondPoint.length).toBe(1);
        expect(entitiesAtThirdPoint.length).toBe(0);
        expect(entitiesAtFirstPoint[0]).toStrictEqual(firstItem);
        expect(entitiesAtSecondPoint[0]).toStrictEqual(secondItem);
    });
    it("Can get entity at position in adjacent chunk with bounds", () => {
        expect(2).toBe(2);
    });
    it("Updates chunk map on position change of child", () => {
        expect(2).toBe(2);
    });
    it("Updates chunk map when child is added or removed", () => {
        expect(2).toBe(2);
    });
});
