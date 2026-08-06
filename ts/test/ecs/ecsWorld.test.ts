import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";

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
