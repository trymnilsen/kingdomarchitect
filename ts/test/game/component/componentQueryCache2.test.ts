import { beforeEach, describe, expect, it } from "vitest";
import { Entity } from "../../../src/game/entity/entity.js";
import {
    ComponentsQueryCache2,
    QueryObject,
} from "../../../src/game/component/componentQueryCache2.js";
import { EntityComponent } from "../../../src/game/component/entityComponent.js";

class FakeComponent extends EntityComponent {}

describe("ComponentsQueryCache2", () => {
    let rootEntity: Entity;
    let cache: ComponentsQueryCache2;

    beforeEach(() => {
        rootEntity = new Entity("root");
        cache = new ComponentsQueryCache2(rootEntity);
    });

    it("should return an empty iterator when querying an empty cache", () => {
        const query: QueryObject = {};
        const result = Array.from(cache.query(query));
        expect(result).toEqual([]);
    });

    it("should add an entity and retrieve it with a matching query", () => {
        const entity = new Entity("e1");
        rootEntity.addChild(entity);

        const component = new FakeComponent();
        entity.addComponent(component);

        const query: QueryObject = { TestComponent: FakeComponent };
        cache.addEntity(entity);
        const result = Array.from(cache.query(query));

        expect(result.length).toBe(1);
        expect(result[0]["TestComponent"]).toBe(component);
    });

    it("should not return an entity if it does not match the query", () => {
        const entity = new Entity("e2");
        cache.addEntity(entity);

        const query: QueryObject = { SomeComponent: FakeComponent };
        const result = Array.from(cache.query(query));
        expect(result).toEqual([]);
    });

    it("should remove an entity from the cache", () => {
        const entity = new Entity("e3");
        entity.addComponent(new FakeComponent());

        const query: QueryObject = { TestComponent: FakeComponent };
        cache.addEntity(entity);
        cache.removeEntity(entity);
        const result = Array.from(cache.query(query));

        expect(result).toEqual([]);
    });

    it("should remove an entity when a required component is removed", () => {
        const entity = new Entity("e4");
        const component = new FakeComponent();
        entity.addComponent(component);

        const query: QueryObject = { TestComponent: FakeComponent };
        cache.addEntity(entity);
        entity.removeComponent(component);
        cache.removeComponent(component);

        const result = Array.from(cache.query(query));
        expect(result).toEqual([]);
    });

    it("should update cache when a new matching component is added", () => {
        const entity = new Entity("e5");
        const query: QueryObject = { TestComponent: FakeComponent };

        cache.addEntity(entity);
        expect(Array.from(cache.query(query))).toEqual([]);

        const component = new FakeComponent();
        entity.addComponent(component);
        cache.addComponent(component);

        const result = Array.from(cache.query(query));
        expect(result.length).toBe(1);
        expect(result[0]["TestComponent"]).toBe(component);
    });

    it("should handle multiple entities with different components", () => {
        const entity1 = new Entity("e6");
        const entity2 = new Entity("e7");
        rootEntity.addChild(entity1);
        rootEntity.addChild(entity2);
        const component1 = new FakeComponent();
        const component2 = new FakeComponent();

        entity1.addComponent(component1);
        entity2.addComponent(component2);

        const query: QueryObject = { TestComponent: FakeComponent };
        cache.addEntity(entity1);
        cache.addEntity(entity2);

        const queryResult = cache.query(query);
        const result = Array.from(queryResult);
        expect(result.length).toBe(2);
    });

    it("should not add duplicate entities to the cache", () => {
        const entity = new Entity("e8");
        rootEntity.addChild(entity);
        entity.addComponent(new FakeComponent());

        const query: QueryObject = { TestComponent: FakeComponent };
        cache.addEntity(entity);
        cache.addEntity(entity); // Adding twice should not duplicate

        const result = Array.from(cache.query(query));
        expect(result.length).toBe(1);
    });
});
