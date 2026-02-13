import { describe, it } from "node:test";
import assert from "node:assert";
import { executeWarmByFireAction } from "../../../../src/game/behavior/actions/warmByFireAction.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createWarmthComponent, WarmthComponentId } from "../../../../src/game/component/warmthComponent.ts";
import { createFireSourceComponent } from "../../../../src/game/component/fireSourceComponent.ts";
import { InvalidationTracker } from "../behaviorTestHelpers.ts";

function createTestGoblin(warmth: number = 50, x: number = 0, y: number = 0): Entity {
    const entity = new Entity("goblin-1");
    entity.setEcsComponent(createWarmthComponent(warmth));
    entity.position = { x, y };
    return entity;
}

function createTestFire(active: boolean = true, x: number = 0, y: number = 0): Entity {
    const fire = new Entity("fire-1");
    const fireComponent = createFireSourceComponent(15, 2, 1);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    fire.position = { x, y };
    return fire;
}

describe("warmByFireAction", () => {
    describe("executeWarmByFireAction", () => {
        it("increases warmth when adjacent to active fire", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(true, 1, 0); // Adjacent

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            const warmth = goblin.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 65); // 50 + 15 (activeWarmthRate)
            assert.strictEqual(status, "running");
        });

        it("returns complete when warmth reaches 100", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(90, 0, 0);
            const fire = createTestFire(true, 1, 0);

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            const warmth = goblin.getEcsComponent("Warmth");
            assert.ok(warmth);
            assert.strictEqual((warmth as any).warmth, 100); // Clamped to 100
            assert.strictEqual(status, "complete");
        });

        it("returns failed when fire entity not found", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            root.addChild(goblin);

            const action = { type: "warmByFire" as const, fireEntityId: "nonexistent" };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status, "failed");
        });

        it("returns failed when fire is not active", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(false, 1, 0);

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status, "failed");
        });

        it("returns failed when not adjacent to fire", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(true, 5, 5); // Not adjacent

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status, "failed");
        });

        it("returns failed when goblin has no warmth component", () => {
            const root = new Entity("root");
            const goblin = new Entity("goblin-1");
            const fire = createTestFire(true, 1, 0);

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status, "failed");
        });

        it("works with diagonal adjacency", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(true, 1, 1); // Diagonal

            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status, "running");
        });
    });

    describe("component invalidation", () => {
        it("invalidates WarmthComponent when warming succeeds", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(true, 1, 0);
            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            executeWarmByFireAction(action, goblin);

            assert.strictEqual(
                tracker.wasInvalidated("goblin-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated after warming",
            );
        });

        it("does not invalidate WarmthComponent when action fails", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(false, 1, 0); // Inactive fire
            root.addChild(goblin);
            root.addChild(fire);

            const action = { type: "warmByFire" as const, fireEntityId: fire.id };
            executeWarmByFireAction(action, goblin);

            assert.strictEqual(
                tracker.wasInvalidated("goblin-1", WarmthComponentId),
                false,
                "WarmthComponent should not be invalidated when action fails",
            );
        });
    });
});
