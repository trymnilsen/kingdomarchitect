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
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import {
    createBuildingComponent,
} from "../../../../src/game/component/buildingComponent.ts";
import { nullBuilding } from "../../../../src/data/building/building.ts";
import { negotiateDisplacement } from "../../../../src/game/behavior/displacement/displacementNegotiation.ts";
import type { SpriteRef } from "../../../../src/asset/sprite.ts";

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

/**
 * World covering world tiles x=8..23, y=8..15.
 * Tiles at y=7 (north of row y=8) fall outside any chunk and score -Infinity,
 * acting as natural walls. Tiles at y=9 and beyond (inside the chunk) are
 * valid ground unless explicitly blocked with a building entity.
 */
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
 * Create a displaceable agent entity at the given position.
 * Must set worldPosition AFTER addChild so the parent transform is available.
 */
function createAgent(
    id: string,
    utility: number,
    root: Entity,
    x: number,
    y: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    const agent = getBehaviorAgent(entity)!;
    agent.currentBehaviorUtility = utility;
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

/**
 * Place an impassable building entity at a tile to block displacement paths.
 * The nullBuilding id is not "road", so scoreCandidateTile returns -Infinity.
 */
function createWall(id: string, root: Entity, x: number, y: number): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBuildingComponent(nullBuilding, false));
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

describe("displacementNegotiation", () => {
    describe("negotiateDisplacement", () => {
        it("returns noChain when target tile has no displaceable entity", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", 100, root, 10, 8);
            // Building at target — no BehaviorAgentComponent
            createWall("wall", root, 11, 8);

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.strictEqual(result.kind, "noChain");
        });

        it("returns refused when blocker resistance exceeds requester priority", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", 5, root, 10, 8);
            // Blocker utility = 20, so resistance = 20. Requester priority = 5 < 20.
            createAgent("blocker", 20, root, 11, 8);

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 5, root, 1);

            assert.strictEqual(result.kind, "refused");
        });

        it("returns refused when blocker has already moved this tick", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", 100, root, 10, 8);
            const blocker = createAgent("blocker", 0, root, 11, 8);
            const stamina = blocker.getEcsComponent("MovementStamina")!;
            // Record a move at the current tick — makes hasMovedThisTick return true
            recordMove(stamina, 5);

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 5);

            assert.strictEqual(result.kind, "refused");
        });

        it("returns a single-move non-cycle transaction when blocker has a free tile", () => {
            const { root } = createTestWorld();
            // Requester at (10,8), wants (11,8) where blocker is.
            // (12,8) is free — blocker can move there.
            // (11,9) is also free in the chunk, so blocker has multiple exits.
            const requester = createAgent("requester", 100, root, 10, 8);
            createAgent("blocker", 5, root, 11, 8);

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.ok(result.kind === "success", "Should return a transaction");
            assert.strictEqual(result.transaction.isCycle, false);
            assert.strictEqual(result.transaction.moves.length, 1);
            assert.strictEqual(result.transaction.moves[0].entityId, "blocker");
            assert.deepStrictEqual(result.transaction.moves[0].from, { x: 11, y: 8 });
        });

        it("returns a 2-move cycle transaction when blocker can only swap with requester", () => {
            const { root } = createTestWorld();
            // Requester at (10,8) wants (11,8) where B is.
            // Block all of B's exits except (10,8) = requester's position.
            // (11,7) is automatically a wall (outside chunk at y=7).
            const requester = createAgent("requester", 100, root, 10, 8);
            createAgent("blocker", 5, root, 11, 8);
            createWall("wall-east", root, 12, 8);
            createWall("wall-south", root, 11, 9);
            // B's only valid candidate is (10,8) = requester → cycle

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.ok(result.kind === "success", "Should return a cycle transaction");
            assert.strictEqual(result.transaction.isCycle, true);
            assert.strictEqual(result.transaction.moves.length, 2);

            const blockerMove = result.transaction.moves.find((m) => m.entityId === "blocker");
            const requesterMove = result.transaction.moves.find((m) => m.entityId === "requester");
            assert.ok(blockerMove, "Should include blocker move");
            assert.ok(requesterMove, "Should include requester move");
            assert.deepStrictEqual(blockerMove!.from, { x: 11, y: 8 });
            assert.deepStrictEqual(blockerMove!.to, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.from, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.to, { x: 11, y: 8 });
        });

        it("returns a 2-move chain when blocker must displace a second entity", () => {
            const { root } = createTestWorld();
            // Requester at (8,8) — NOT adjacent to B — targeting (11,8).
            // This prevents A from appearing in B's cardinal-neighbor list,
            // so there is no cycle shortcut: B's only exit is through C.
            const requester = createAgent("requester", 100, root, 8, 8);
            createAgent("blocker-b", 5, root, 11, 8);
            createAgent("blocker-c", 5, root, 12, 8);
            // Block all of B's exits except east (12,8)=C
            createWall("wall-bw", root, 10, 8); // west of B
            createWall("wall-bs", root, 11, 9); // south of B
            // north of B (11,7) is outside the chunk — natural wall
            // C's north (12,7) is also outside — natural wall
            // C's south (12,9) is free — that's where C will move
            // C's west (11,8) is B (visited in chain) — skipped

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.ok(result.kind === "success", "Should return a 2-move chain");
            assert.strictEqual(result.transaction.isCycle, false);
            assert.strictEqual(result.transaction.moves.length, 2);

            assert.strictEqual(result.transaction.moves[0].entityId, "blocker-b");
            assert.deepStrictEqual(result.transaction.moves[0].from, { x: 11, y: 8 });
            assert.deepStrictEqual(result.transaction.moves[0].to, { x: 12, y: 8 });

            assert.strictEqual(result.transaction.moves[1].entityId, "blocker-c");
            assert.deepStrictEqual(result.transaction.moves[1].from, { x: 12, y: 8 });
        });

        it("prefers a free tile over a cycle when both are available", () => {
            const { root } = createTestWorld();
            // Requester at (10,8) adjacent to B at (11,8).
            // B has both: (12,8) free (score 100) AND (10,8)=requester (cycle).
            // The free tile is scored higher so it must be chosen.
            const requester = createAgent("requester", 100, root, 10, 8);
            createAgent("blocker", 5, root, 11, 8);
            // (12,8) and (11,9) are both free — B will pick one immediately

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.ok(result.kind === "success");
            assert.strictEqual(result.transaction.isCycle, false, "Free tile should be preferred over cycle");
        });

        it("returns null when the chain exceeds max depth without finding a free tile", () => {
            const { root } = createTestWorld();
            // Chain: B(11,8) → C(12,8) → D(13,8) → E(14,8) → F(15,8).
            // Requester at (8,8) is NOT adjacent to B, so no cycle shortcut exists.
            // Each entity can only move east. F blocks E's exit at depth=3,
            // which is MAX_CHAIN_DEPTH, so the search gives up.
            const requester = createAgent("requester", 100, root, 8, 8);
            createAgent("b", 5, root, 11, 8);
            createAgent("c", 5, root, 12, 8);
            createAgent("d", 5, root, 13, 8);
            createAgent("e", 5, root, 14, 8);
            createAgent("f", 5, root, 15, 8); // blocks E's only exit

            // Block south of each entity so they can only go east (or west = visited)
            createWall("wall-b-w", root, 10, 8);
            createWall("wall-b-s", root, 11, 9);
            createWall("wall-c-s", root, 12, 9);
            createWall("wall-d-s", root, 13, 9);
            createWall("wall-e-s", root, 14, 9);
            createWall("wall-f-s", root, 15, 9);
            // North of each is automatically a wall (y=7, outside chunk)

            const result = negotiateDisplacement(requester, { x: 11, y: 8 }, 100, root, 1);

            assert.strictEqual(result.kind, "noChain", "Chain exceeding max depth should return noChain");
        });
    });
});
