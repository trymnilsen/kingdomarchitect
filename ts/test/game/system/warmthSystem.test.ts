import { describe, it } from "node:test";
import assert from "node:assert";
import { warmthSystem } from "../../../src/game/system/warmthSystem.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createWarmthComponent, WarmthComponentId } from "../../../src/game/component/warmthComponent.ts";
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
    const fireComponent = createFireSourceComponent(15, passiveRate, 1);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    fire.worldPosition = { x, y };
    return fire;
}

describe("warmthSystem", () => {
    describe("warmth decay", () => {
        it("decreases warmth by decay rate each tick", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 80, 1);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 79);
        });

        it("uses entity-specific decay rate", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 80, 3);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 77);
        });

        it("does not go below 0", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 2, 5);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 0);
        });
    });

    describe("passive warming from fire", () => {
        it("increases warmth when adjacent to active fire", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 1, 0); // Adjacent

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) + 5 (passive) = 54
            assert.strictEqual((warmth as any).warmth, 54);
        });

        it("works with diagonal adjacency", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 1, 1); // Diagonal

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) + 5 (passive) = 54
            assert.strictEqual((warmth as any).warmth, 54);
        });

        it("does not warm when fire is not adjacent", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 5, 5); // Not adjacent

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) = 49, no passive warming
            assert.strictEqual((warmth as any).warmth, 49);
        });

        it("does not warm when fire is inactive", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", false, 5, 1, 0); // Adjacent but inactive

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) = 49, no passive warming
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

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 50 - 1 (decay) + 5 (one fire bonus) = 54, NOT 59
            assert.strictEqual((warmth as any).warmth, 54);
        });

        it("caps warmth at 100", () => {
            const root = new Entity("root");
            const entity = createTestEntityWithWarmth("entity-1", 98, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 1, 0);

            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            const warmth = entity.getEcsComponent("Warmth");
            assert.ok(warmth);
            // 98 - 1 (decay) + 5 (passive) = 102, clamped to 100
            assert.strictEqual((warmth as any).warmth, 100);
        });
    });

    describe("multiple entities", () => {
        it("processes all entities with warmth component", () => {
            const root = new Entity("root");
            const entity1 = createTestEntityWithWarmth("entity-1", 80, 1, 0, 0);
            const entity2 = createTestEntityWithWarmth("entity-2", 60, 2, 5, 5);

            root.addChild(entity1);
            root.addChild(entity2);

            warmthSystem.onUpdate!(root, 1);

            const warmth1 = entity1.getEcsComponent("Warmth");
            const warmth2 = entity2.getEcsComponent("Warmth");

            assert.ok(warmth1);
            assert.ok(warmth2);
            assert.strictEqual((warmth1 as any).warmth, 79);
            assert.strictEqual((warmth2 as any).warmth, 58);
        });
    });

    describe("component invalidation", () => {
        it("invalidates WarmthComponent after decay", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const entity = createTestEntityWithWarmth("entity-1", 80, 1);
            root.addChild(entity);

            warmthSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("entity-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated after decay",
            );
        });

        it("invalidates WarmthComponent after passive warming", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const entity = createTestEntityWithWarmth("entity-1", 50, 1, 0, 0);
            const fire = createTestFire("fire-1", true, 5, 1, 0);
            root.addChild(entity);
            root.addChild(fire);

            warmthSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("entity-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated after passive warming",
            );
        });

        it("invalidates WarmthComponent for all entities", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const entity1 = createTestEntityWithWarmth("entity-1", 80, 1, 0, 0);
            const entity2 = createTestEntityWithWarmth("entity-2", 60, 2, 5, 5);
            root.addChild(entity1);
            root.addChild(entity2);

            warmthSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("entity-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated for entity-1",
            );
            assert.strictEqual(
                tracker.wasInvalidated("entity-2", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated for entity-2",
            );
        });
    });
});
