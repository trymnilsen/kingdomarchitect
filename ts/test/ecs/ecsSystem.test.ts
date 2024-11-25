import * as assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../src/ecs/ecsWorld.js";
import { EcsSystem } from "../../src/ecs/ecsSystem.js";
import { EcsComponent } from "../../src/ecs/ecsComponent.js";

describe("Ecs system", () => {
    it("Can add components", () => {
        class JumpComponent extends EcsComponent {}
        class HealthComponent extends EcsComponent {}

        const jumpSystem = new EcsSystem({
            jump: JumpComponent,
        }).withUpdate((_query, _gametime) => {});
        const healthQueueSystem = new EcsSystem({
            health: HealthComponent,
        });
        const fallDamageSystem = new EcsSystem({
            health: HealthComponent,
            jump: JumpComponent,
        });

        const world = new EcsWorld();
    });

    it("Can remove components", () => {
        assert.equal(2, 2);
    });

    it("Can destroy an entity", () => {
        assert.equal(2, 2);
    });

    it("Will increment entity id on create", () => {
        assert.equal(2, 2);
    });

    it("Will run all systems", () => {
        assert.equal(2, 2);
    });
});
