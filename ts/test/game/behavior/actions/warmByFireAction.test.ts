import { describe, it } from "node:test";
import assert from "node:assert";
import { executeWarmByFireAction } from "../../../../src/game/behavior/actions/warmByFireAction.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createWarmthComponent,
    WarmthComponentId,
} from "../../../../src/game/component/warmthComponent.ts";
import { createFireSourceComponent } from "../../../../src/game/component/fireSourceComponent.ts";
import { InvalidationTracker } from "../behaviorTestHelpers.ts";

function createTestGoblin(
    warmth: number = 50,
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = new Entity("goblin-1");
    entity.setEcsComponent(createWarmthComponent(warmth));
    entity.position = { x, y };
    return entity;
}

function createTestFire(
    active: boolean = true,
    x: number = 0,
    y: number = 0,
): Entity {
    const fire = new Entity("fire-1");
    const fireComponent = createFireSourceComponent(15, 2);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    fire.position = { x, y };
    return fire;
}

describe("warmByFireAction", () => {
    describe("executeWarmByFireAction", () => {
        it("returns failed when fire is not active", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(false, 1, 0);

            root.addChild(goblin);
            root.addChild(fire);

            const action = {
                type: "warmByFire" as const,
                fireEntityId: fire.id,
            };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status.kind, "failed");
        });

        it("works with diagonal adjacency", () => {
            const root = new Entity("root");
            const goblin = createTestGoblin(50, 0, 0);
            const fire = createTestFire(true, 1, 1); // Diagonal

            root.addChild(goblin);
            root.addChild(fire);

            const action = {
                type: "warmByFire" as const,
                fireEntityId: fire.id,
            };
            const status = executeWarmByFireAction(action, goblin);

            assert.strictEqual(status.kind, "running");
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

            const action = {
                type: "warmByFire" as const,
                fireEntityId: fire.id,
            };
            executeWarmByFireAction(action, goblin);

            assert.strictEqual(
                tracker.wasInvalidated("goblin-1", WarmthComponentId),
                true,
                "WarmthComponent should be invalidated after warming",
            );
        });
    });
});
