import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";
import { Entity } from "../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../src/game/component/healthComponent.ts";

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
});
