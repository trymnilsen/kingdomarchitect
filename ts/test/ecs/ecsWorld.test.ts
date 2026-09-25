import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";
import { Entity } from "../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
    type HealthComponent,
} from "../../src/game/component/healthComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
} from "../../src/game/component/hungerComponent.ts";

describe("EcsWorld.runUpdate", () => {
    it("isolates a throwing system so later systems still run", () => {
        const world = new EcsWorld();
        const ran: string[] = [];

        world.addSystem({
            onUpdate: () => {
                throw new Error("boom");
            },
        });
        world.addSystem({
            onUpdate: () => {
                ran.push("second");
            },
        });

        // A throw in one update system must not abort the tick or escape to the
        // caller (the game loop's setInterval has no guard of its own).
        assert.doesNotThrow(() => world.runUpdate(1));
        assert.deepStrictEqual(ran, ["second"]);
    });
});

describe("EcsWorld component subscriptions", () => {
    function attachedEntity(world: EcsWorld, id: string): Entity {
        const entity = new Entity(id);
        world.root.addChild(entity);
        return entity;
    }

    it("calls a handler only for the component it subscribed to", () => {
        const world = new EcsWorld();
        const seen: string[] = [];
        world.addSystem({
            onComponent: {
                updated: {
                    [HealthComponentId]: (_root, event) => {
                        // item is typed as a HealthComponent for this handler
                        seen.push(`health ${event.item.currentHp}`);
                    },
                },
            },
        });
        const entity = attachedEntity(world, "a");

        entity.setEcsComponent(createHungerComponent());
        entity.setEcsComponent(createHealthComponent(40, 100));
        entity.invalidateComponent(HungerComponentId);

        assert.deepStrictEqual(seen, ["health 40"]);
    });

    it("treats a first set, a replace, an in-place update and an invalidate as updates", () => {
        const world = new EcsWorld();
        const events: Array<{ hp: number; oldHp: number | undefined }> = [];
        world.addSystem({
            onComponent: {
                updated: {
                    [HealthComponentId]: (_root, event) => {
                        events.push({
                            hp: event.item.currentHp,
                            oldHp: event.oldValue?.currentHp,
                        });
                    },
                },
            },
        });
        const entity = attachedEntity(world, "a");

        entity.setEcsComponent(createHealthComponent(10, 100));
        entity.setEcsComponent(createHealthComponent(20, 100));
        entity.updateComponent(
            HealthComponentId,
            (component: HealthComponent) => {
                component.currentHp = 30;
            },
        );
        entity.invalidateComponent(HealthComponentId);

        assert.deepStrictEqual(events, [
            { hp: 10, oldHp: undefined },
            { hp: 20, oldHp: undefined },
            { hp: 30, oldHp: 20 },
            { hp: 30, oldHp: undefined },
        ]);
    });

    it("calls removed handlers with the component that was removed", () => {
        const world = new EcsWorld();
        const removed: number[] = [];
        world.addSystem({
            onComponent: {
                removed: {
                    [HealthComponentId]: (_root, event) => {
                        removed.push(event.item.currentHp);
                    },
                },
            },
        });
        const entity = attachedEntity(world, "a");
        entity.setEcsComponent(createHealthComponent(25, 100));
        entity.setEcsComponent(createHungerComponent());

        entity.removeEcsComponent(HungerComponentId);
        entity.removeEcsComponent(HealthComponentId);

        assert.deepStrictEqual(removed, [25]);
    });

    it("calls every system subscribed to the same component, even after one throws", () => {
        const world = new EcsWorld();
        const ran: string[] = [];
        world.addSystem({
            onComponent: {
                updated: {
                    [HealthComponentId]: () => {
                        throw new Error("boom");
                    },
                },
            },
        });
        world.addSystem({
            onComponent: {
                updated: {
                    [HealthComponentId]: () => {
                        ran.push("second");
                    },
                },
            },
        });
        const entity = attachedEntity(world, "a");

        assert.doesNotThrow(() =>
            entity.setEcsComponent(createHealthComponent(1, 1)),
        );
        assert.deepStrictEqual(ran, ["second"]);
    });

    it("keeps delivering every component update to onEntityEvent handlers", () => {
        const world = new EcsWorld();
        const seen: string[] = [];
        world.addSystem({
            onEntityEvent: {
                component_updated: (_root, event) => {
                    seen.push(event.item.id);
                },
            },
        });
        const entity = attachedEntity(world, "a");

        entity.setEcsComponent(createHealthComponent(1, 1));
        entity.setEcsComponent(createHungerComponent());

        assert.deepStrictEqual(seen, [HealthComponentId, HungerComponentId]);
    });

    it("does not deliver events for an entity that was removed from the tree", () => {
        const world = new EcsWorld();
        const seen: string[] = [];
        world.addSystem({
            onComponent: {
                updated: {
                    [HealthComponentId]: (_root, event) => {
                        seen.push(event.source.id);
                    },
                },
            },
        });
        const entity = attachedEntity(world, "a");
        entity.setEcsComponent(createHealthComponent(1, 1));
        entity.remove();

        entity.invalidateComponent(HealthComponentId);
        entity.setEcsComponent(createHealthComponent(2, 2));

        assert.deepStrictEqual(seen, ["a"]);
        assert.ok(
            !world.root.queryComponents(HealthComponentId).has(entity),
            "a removed entity must not come back into the query cache",
        );
    });
});
