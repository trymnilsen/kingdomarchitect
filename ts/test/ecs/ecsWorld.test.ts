import assert from "assert";
import { describe, it, beforeEach } from "node:test";
import { EcsComponent } from "../../src/ecs/ecsComponent.js";
import {
    createSystem,
    EcsSystem,
    QueryData,
    QueryObject,
} from "../../src/ecs/ecsSystem.js";
import { EcsWorld } from "../../src/ecs/ecsWorld.js";
import { EcsUpdateEvent } from "../../src/ecs/event/ecsUpdateEvent.js";

class Position extends EcsComponent {
    constructor(
        public x: number,
        public y: number,
    ) {
        super();
    }
}

class Velocity extends EcsComponent {
    constructor(
        public dx: number,
        public dy: number,
    ) {
        super();
    }
}

describe("EcsWorld", () => {
    let ecsWorld: EcsWorld;

    beforeEach(() => {
        ecsWorld = new EcsWorld();
    });

    describe("createEntity", () => {
        it("Create a new entity with a unique ID", () => {
            const entity1 = ecsWorld.createEntity();
            const entity2 = ecsWorld.createEntity();

            assert.strictEqual(typeof entity1, "number");
            assert.strictEqual(typeof entity2, "number");
            assert.notStrictEqual(entity1, entity2);
        });

        it("should not reuse entity IDs after destruction", () => {
            const id = ecsWorld.createEntity();
            ecsWorld.destroyEntity(id);
            const newId = ecsWorld.createEntity();
            assert.strictEqual(
                id !== newId,
                true,
                "Entity IDs should not be reused after destruction",
            );
        });
    });

    describe("addComponent", () => {
        it("Add a component to an entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            ecsWorld.addComponent(entity, position);

            assert.ok(ecsWorld.components.hasEntity(entity));
        });

        it("Query map is updated on add", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);

            const system = createSystem({ position: Position })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 1);
                    assert.strictEqual(results[0].position, position);
                })
                .build();

            ecsWorld.addSystems([system]);
            ecsWorld.addComponent(entity, position);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });

        it("Allow multiple components on the same entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            const velocity = new Velocity(1, 1);

            const system = createSystem({
                position: Position,
                velocity: Velocity,
            })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 1);
                    assert.deepStrictEqual(results[0], { position, velocity });
                })
                .build();

            ecsWorld.addSystems([system]);

            ecsWorld.addComponent(entity, position);
            ecsWorld.addComponent(entity, velocity);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });

        it("should set entity id on component", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            ecsWorld.addComponent(entity, position);
            assert.strictEqual(position.entity, entity);
        });
    });

    describe("removeComponent", () => {
        it("Remove a component from an entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            ecsWorld.addComponent(entity, position);
            ecsWorld.removeComponent(entity, position);

            assert.ok(!ecsWorld.components.hasEntity(entity));
        });

        it("Retain the entity if other components remain", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            const velocity = new Velocity(1, 1);

            ecsWorld.addComponent(entity, position);
            ecsWorld.addComponent(entity, velocity);
            ecsWorld.removeComponent(entity, position);

            assert.ok(ecsWorld.components.hasEntity(entity));
        });

        it("Update query map when query no longer matches", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            let updates = 0;
            const system = createSystem({ position: Position })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const array = Array.from(query);
                    if (array.length > 0) {
                        updates++;
                    }
                })
                .build();

            ecsWorld.addSystems([system]);
            ecsWorld.addComponent(entity, position);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
            ecsWorld.removeComponent(entity, position);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
            assert.equal(updates, 1);
        });

        it("should remove entity id on component", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            ecsWorld.addComponent(entity, position);
            assert.strictEqual(position.entity, entity);
            ecsWorld.removeComponent(entity, position);
            assert.strictEqual(position.entity, undefined);
        });
    });

    describe("destroyEntity", () => {
        it("Remove all components from an entity", () => {
            const entity = ecsWorld.createEntity();
            ecsWorld.addComponent(entity, new Position(10, 20));
            ecsWorld.addComponent(entity, new Velocity(1, 1));

            ecsWorld.destroyEntity(entity);
            assert.ok(!ecsWorld.components.hasEntity(entity));
        });

        it("should handle destroying non-existent entities gracefully", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            ecsWorld.addComponent(entity, position);

            const destroyResult = ecsWorld.destroyEntity(999);

            assert.equal(ecsWorld.components.hasEntity(entity), true);
        });

        it("should set entity id to undefined on all components", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            const velocity = new Velocity(1, 1);
            ecsWorld.addComponent(entity, position);
            ecsWorld.addComponent(entity, velocity);
            ecsWorld.destroyEntity(entity);
            assert.strictEqual(position.entity, undefined);
            assert.strictEqual(velocity.entity, undefined);
        });
    });

    describe("Query", () => {
        it("should process entities with matching components during system update", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);

            const system = createSystem({ position: Position })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 1);
                    assert.strictEqual(results[0].position, position);
                })
                .build();

            ecsWorld.addSystems([system]);
            ecsWorld.addComponent(entity, position);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });

        it("should not process entities that do not match the query", () => {
            const entity = ecsWorld.createEntity();
            ecsWorld.addComponent(entity, new Velocity(1, 1));

            const system = createSystem({ position: Position })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 0);
                })
                .build();

            ecsWorld.addSystems([system]);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });
    });

    describe("Dispatch", () => {
        it("should dispatch event when query is empty", () => {
            const system = createSystem({})
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 0);
                })
                .build();

            ecsWorld.addSystems([system]);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });

        it("dispatch has the right amount of components in query data", () => {
            const entity1 = ecsWorld.createEntity();
            const position1 = new Position(10, 20);
            const velocity1 = new Velocity(1, 1);

            const entity2 = ecsWorld.createEntity();
            const position2 = new Position(20, 25);
            const velocity2 = new Velocity(1, 1);

            const entity3 = ecsWorld.createEntity();
            const position3 = new Position(15, 22);

            const system = createSystem({
                position: Position,
                velocity: Velocity,
            })
                .onEvent(EcsUpdateEvent, (query, _event, _world) => {
                    const results = Array.from(query);
                    assert.strictEqual(results.length, 2);
                    assert.deepEqual(results[0], {
                        position: position1,
                        velocity: velocity1,
                    });
                    assert.deepEqual(results[1], {
                        position: position2,
                        velocity: velocity2,
                    });
                })
                .build();

            ecsWorld.addSystems([system]);

            ecsWorld.addComponent(entity1, position1);
            ecsWorld.addComponent(entity1, velocity1);
            ecsWorld.addComponent(entity2, position2);
            ecsWorld.addComponent(entity2, velocity2);
            ecsWorld.addComponent(entity3, position3);
            ecsWorld.dispatchEvent(new EcsUpdateEvent());
        });
    });
});
