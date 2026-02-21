import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createBehaviorAgentComponent,
    getBehaviorAgent,
} from "../../../../src/game/component/BehaviorAgentComponent.ts";
import {
    createMovementStaminaComponent,
    MovementStaminaComponentId,
    hasMovedThisTick,
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import {
    commitDisplacementTransaction,
    type DisplacementTransaction,
} from "../../../../src/game/behavior/displacement/displacementTransaction.ts";
import type { SpriteRef } from "../../../../src/asset/sprite.ts";

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

function createTestWorld(): { root: Entity } {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX: 1, chunkY: 1 });
    setChunk(tileComponent, { chunkX: 2, chunkY: 1 });
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());

    return { root };
}

/**
 * Create an agent entity with stamina tracking so commit can record moves.
 * worldPosition is set AFTER addChild.
 */
function createAgent(
    id: string,
    root: Entity,
    x: number,
    y: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

describe("displacementTransaction", () => {
    describe("commitDisplacementTransaction", () => {
        it("returns true and moves entity on a valid single-step chain", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "b", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 1, "requester");

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(b.worldPosition, { x: 12, y: 8 });
        });

        it("returns false when entity is not at the expected from-position", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);
            // Move entity before commit — stale transaction
            b.worldPosition = { x: 13, y: 8 };

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "b", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 1, "requester");

            assert.strictEqual(committed, false);
        });

        it("returns false when entity has already moved this tick", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);
            const stamina = b.getEcsComponent(MovementStaminaComponentId)!;
            recordMove(stamina, 5); // entity moved at tick 5

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "b", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 5, "requester");

            assert.strictEqual(committed, false);
            // Entity should not have moved
            assert.deepStrictEqual(b.worldPosition, { x: 11, y: 8 });
        });

        it("returns false when entity is not found in the entity tree", () => {
            const { root } = createTestWorld();

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "ghost", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 1, "requester");

            assert.strictEqual(committed, false);
        });

        it("commits a 2-move chain in reverse order (last entity moves first)", () => {
            const { root } = createTestWorld();

            // B at (11,8) moves to (12,8); C at (12,8) moves to (13,8).
            // Correct execution order: C moves first (into free tile at 13,8), then B.
            // If the chain were applied front-to-back, B would try to move to (12,8)
            // which is still occupied by C — the commit would be invalid. Reverse
            // order is the only correct execution, and a successful commit (true)
            // with correct final positions validates it implicitly.
            const b = createAgent("b", root, 11, 8);
            const c = createAgent("c", root, 12, 8);

            const tx: DisplacementTransaction = {
                moves: [
                    { entityId: "b", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } },
                    { entityId: "c", from: { x: 12, y: 8 }, to: { x: 13, y: 8 } },
                ],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 1, "requester");

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(b.worldPosition, { x: 12, y: 8 });
            assert.deepStrictEqual(c.worldPosition, { x: 13, y: 8 });
        });

        it("commits a cycle transaction (A↔B swap) simultaneously", () => {
            const { root } = createTestWorld();
            const a = createAgent("a", root, 10, 8);
            const b = createAgent("b", root, 11, 8);

            const tx: DisplacementTransaction = {
                moves: [
                    { entityId: "b", from: { x: 11, y: 8 }, to: { x: 10, y: 8 } },
                    { entityId: "a", from: { x: 10, y: 8 }, to: { x: 11, y: 8 } },
                ],
                isCycle: true,
            };

            // "a" is the requester in this cycle (a wanted to move to b's tile)
            const committed = commitDisplacementTransaction(tx, root, 1, "a");

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(a.worldPosition, { x: 11, y: 8 });
            assert.deepStrictEqual(b.worldPosition, { x: 10, y: 8 });
        });

        it("records a move on the stamina component after committing", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "b", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            commitDisplacementTransaction(tx, root, 7, "requester");

            const stamina = b.getEcsComponent(MovementStaminaComponentId)!;
            assert.strictEqual(hasMovedThisTick(stamina, 7), true);
        });

        it("sets pendingReplan on displaced entities but not on the requester", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8);
            const displaced = createAgent("displaced", root, 11, 8);

            // Clear initial pendingReplan so we can detect if it was re-set
            const requesterAgent = getBehaviorAgent(requester)!;
            const displacedAgent = getBehaviorAgent(displaced)!;
            requesterAgent.pendingReplan = undefined;
            displacedAgent.pendingReplan = undefined;

            const tx: DisplacementTransaction = {
                moves: [
                    { entityId: "displaced", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } },
                ],
                isCycle: false,
            };

            commitDisplacementTransaction(tx, root, 1, "requester");

            assert.ok(
                displacedAgent.pendingReplan,
                "Displaced entity should receive a replan request",
            );
            assert.strictEqual(
                requesterAgent.pendingReplan,
                undefined,
                "Requester should NOT receive a replan (it manages its own moveTo action)",
            );
        });

        it("does not record a move on an entity without MovementStaminaComponent", () => {
            const { root } = createTestWorld();
            // Entity without stamina component — commit should not throw
            const entity = new Entity("no-stamina");
            entity.setEcsComponent(createSpriteComponent(testSprite));
            entity.setEcsComponent(createBehaviorAgentComponent());
            // No MovementStaminaComponent added
            root.addChild(entity);
            entity.worldPosition = { x: 11, y: 8 };

            const tx: DisplacementTransaction = {
                moves: [{ entityId: "no-stamina", from: { x: 11, y: 8 }, to: { x: 12, y: 8 } }],
                isCycle: false,
            };

            const committed = commitDisplacementTransaction(tx, root, 1, "requester");

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(entity.worldPosition, { x: 12, y: 8 });
        });
    });
});
