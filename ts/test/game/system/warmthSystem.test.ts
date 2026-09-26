import { describe, it } from "node:test";
import assert from "node:assert";
import {
    warmthSystem,
    WARMTH_DECAY_TICK_INTERVAL,
} from "../../../src/game/system/warmthSystem.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createWarmthComponent,
    WarmthComponentId,
} from "../../../src/game/component/warmthComponent.ts";
import { createFireSourceComponent } from "../../../src/game/component/fireSourceComponent.ts";
import { InvalidationTracker } from "../behavior/behaviorTestHelpers.ts";

function createTestEntityWithWarmth(
    id: string,
    warmth: number,
    decayRate: number = 1,
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createWarmthComponent(warmth, decayRate));
    entity.worldPosition = { x, y };
    return entity;
}

function createTestFire(
    id: string,
    active: boolean,
    passiveRate: number = 2,
    x: number = 0,
    y: number = 0,
): Entity {
    const fire = new Entity(id);
    const fireComponent = createFireSourceComponent(15, passiveRate);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    fire.worldPosition = { x, y };
    return fire;
}

describe("warmthSystem", () => {
    describe("warmth decay", () => {
        it("uses entity-specific decay rate", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 80, 3);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, WARMTH_DECAY_TICK_INTERVAL);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 77);
        });
    });

    describe("passive warming from fire", () => {
        it("does not warm with diagonal adjacency", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 1, 1); // Diagonal, not cardinal

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, WARMTH_DECAY_TICK_INTERVAL);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) = 49, no passive warming from diagonal
            assert.strictEqual((warmth as any).warmth, 49);
        });

        it("only applies one fire bonus per tick", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire1 = createTestFire("fire-1", true, 5, 1, 0); // Adjacent
            const fire2 = createTestFire("fire-2", true, 5, 0, 1); // Also adjacent

            root.addChild(entity);
            root.addChild(fire1);
            root.addChild(fire2);

            warmthSystem.onUpdate!(root, WARMTH_DECAY_TICK_INTERVAL);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) + 5 (one fire bonus) = 54, NOT 59
            assert.strictEqual((warmth as any).warmth, 54);
        });
    });

    describe("component invalidation", () => {
        it("invalidates WarmthComponent after decay", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const entity = createTestEntityWithWarmth("entity-1", 80, 1);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, WARMTH_DECAY_TICK_INTERVAL);

            assert.strictEqual(
                tracker.wasInvalidated("entity-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated after decay",
            );
        });
    });
});
