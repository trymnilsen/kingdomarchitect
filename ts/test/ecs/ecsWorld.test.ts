import assert from "assert";
import { describe, it, beforeEach } from "node:test";
import { EcsComponent } from "../../src/ecs/ecsComponent.js";
import { EcsSystem, QueryData, QueryObject } from "../../src/ecs/ecsSystem.js";
import { EcsWorld } from "../../src/ecs/ecsWorld.js";
import { SparseSet } from "../../src/common/structure/sparseSet.js";

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
            assert.ok(entity1 < entity2);
            assert.notStrictEqual(entity1, entity2);
        });
    });

    describe("addComponent", () => {
        it("Add a component to an entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);

            ecsWorld.addComponent(entity, position);
            assert(
                ecsWorld.hasEntity(entity),
                "Entity should exist after adding a component",
            );
        });

        it("Allow multiple components on the same entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            const velocity = new Velocity(5, 5);

            ecsWorld.addComponent(entity, position);
            ecsWorld.addComponent(entity, velocity);

            assert(
                ecsWorld.hasEntity(entity),
                "Entity should exist after adding multiple components",
            );
        });
    });

    describe("removeComponent", () => {
        it("Remove a component from an entity", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);

            ecsWorld.addComponent(entity, position);
            const entityExists = ecsWorld.hasEntity(entity);
            ecsWorld.removeComponent(entity, position);

            assert(entityExists, "Entity should exists before removal");
            assert(
                !ecsWorld.hasEntity(entity),
                "Entity should not exist after removing its only component",
            );
        });

        it("Retain the entity if other components remain", () => {
            const entity = ecsWorld.createEntity();
            const position = new Position(10, 20);
            const velocity = new Velocity(5, 5);

            ecsWorld.addComponent(entity, position);
            ecsWorld.addComponent(entity, velocity);
            ecsWorld.removeComponent(entity, position);

            assert(
                ecsWorld.hasEntity(entity),
                "Entity should still exist after removing one of its components",
            );
        });
    });

    describe("destroyEntity", () => {
        it("Remove all components from an entity", () => {
            const entity = ecsWorld.createEntity();
            ecsWorld.addComponent(entity, new Position(10, 20));
            ecsWorld.addComponent(entity, new Velocity(5, 5));

            ecsWorld.destroyEntity(entity);

            assert(
                !ecsWorld.hasEntity(entity),
                "Entity should not exist after being destroyed",
            );
        });
    });

    describe("Query", () => {
        it("should process entities with matching components during system update", () => {
            const ecsWorld = new EcsWorld();

            const position1 = new Position(10, 20);
            const velocity1 = new Velocity(1, 1);

            const position2 = new Position(15, 25);

            const entity1 = ecsWorld.createEntity();
            const entity2 = ecsWorld.createEntity();

            ecsWorld.addComponent(entity1, position1);
            ecsWorld.addComponent(entity1, velocity1);

            ecsWorld.addComponent(entity2, position2);

            // Define the query and the system
            const query = { position: Position, velocity: Velocity };
            let processedEntities: QueryData[] = [];

            const system = new EcsSystem(query);
            system.withUpdate((components) => {
                // Collect the processed entities to assert later
                processedEntities.push(components);
            });

            // Add the system to the world and trigger update
            ecsWorld.addSystem(system);
            ecsWorld.update();

            // Assert that only entity1 (with both Position and Velocity) was processed
            const entries = Object.entries(processedEntities[0]);
            assert.equal(processedEntities.length, 1);
            assert.equal(entries[0][0], "position");
            assert.equal(entries[0][1] instanceof SparseSet, true);
            assert.equal(entries[0][1].size, 1);
            assert.equal(entries[1][0], "velocity");
            assert.equal(entries[1][1] instanceof SparseSet, true);
            assert.equal(entries[1][1].size, 1);
        });

        it("should not process entities that do not match the query", () => {
            const ecsWorld = new EcsWorld();

            const position1 = new Position(10, 20);
            const position2 = new Position(15, 25);

            const entity1 = ecsWorld.createEntity();
            const entity2 = ecsWorld.createEntity();

            ecsWorld.addComponent(entity1, position1);
            ecsWorld.addComponent(entity2, position2);

            // Define the query and the system
            const query = { position: Position, velocity: Velocity };
            let processedEntities: { [id: string]: EcsComponent }[] = [];

            const system = new EcsSystem(query);
            system.withUpdate((components) => {
                // Collect the processed entities to assert later
                processedEntities = [];

                for (const [key, set] of Object.entries(components)) {
                    for (let i = 0; i < set.size; i++) {
                        const component = set.elementAt(i);
                        processedEntities.push({ [key]: component });
                    }
                }
            });

            // Add the system to the world and trigger update
            ecsWorld.addSystem(system);
            ecsWorld.update();

            // Assert that no entities were processed
            assert.strictEqual(processedEntities.length, 0);
        });
    });
});
