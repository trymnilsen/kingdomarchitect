import assert from "node:assert";
import { describe, it } from "node:test";
import { getBehaviorAgent } from "../../../../src/game/component/BehaviorAgentComponent.ts";
import { recordMove } from "../../../../src/game/component/movementStaminaComponent.ts";
import { negotiateDisplacement } from "../../../../src/game/behavior/displacement/displacementNegotiation.ts";
import {
    createAgent,
    createTestWorld,
    createWall,
} from "./displacementTestWorld.ts";

describe("displacementNegotiation", () => {
    describe("negotiateDisplacement", () => {
        it("returns noChain when target tile has no displaceable entity", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 100);
            // Building at target — no BehaviorAgentComponent
            createWall("wall", root, 11, 8);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.strictEqual(result.kind, "noChain");
        });

        it("returns refused when a settled blocker's cost exceeds requester priority", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 5);
            // Settled blocker, utility 20 → displaceable cost 20. Priority 5 < 20.
            createAgent("blocker", root, 11, 8, 20);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.strictEqual(result.kind, "refused");
        });

        it("waits when the blocker has already moved this tick (free next tick)", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 100);
            const blocker = createAgent("blocker", root, 11, 8, 0);
            const stamina = blocker.getEcsComponent("MovementStamina")!;
            // Record a move at the current tick — makes hasMovedThisTick return true, so
            // the blocker is movedThisTick: it can't move again now but is free next tick,
            // so the requester waits and retries rather than routing around it.
            recordMove(stamina, 5);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                5,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("returns a single-move non-cycle transaction when blocker has a free tile", () => {
            const { root } = createTestWorld();
            // Requester at (10,8), wants (11,8) where blocker is.
            // (12,8) is free — blocker can move there.
            // (11,9) is also free in the chunk, so blocker has multiple exits.
            const requester = createAgent("requester", root, 10, 8, 100);
            createAgent("blocker", root, 11, 8, 5);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(result.kind === "success", "Should return a transaction");
            assert.strictEqual(result.transaction.isCycle, false);
            assert.strictEqual(result.transaction.moves.length, 1);
            assert.strictEqual(result.transaction.moves[0].entityId, "blocker");
            assert.deepStrictEqual(result.transaction.moves[0].from, {
                x: 11,
                y: 8,
            });
        });

        it("returns a 2-move cycle transaction when blocker can only swap with requester", () => {
            const { root } = createTestWorld();
            // Requester at (10,8) wants (11,8) where B is.
            // Block all of B's exits except (10,8) = requester's position.
            // (11,7) is automatically a wall (outside chunk at y=7).
            const requester = createAgent("requester", root, 10, 8, 100);
            createAgent("blocker", root, 11, 8, 5);
            createWall("wall-east", root, 12, 8);
            createWall("wall-south", root, 11, 9);
            // B's only valid candidate is (10,8) = requester → cycle

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(
                result.kind === "success",
                "Should return a cycle transaction",
            );
            assert.strictEqual(result.transaction.isCycle, true);
            assert.strictEqual(result.transaction.moves.length, 2);

            const blockerMove = result.transaction.moves.find(
                (m) => m.entityId === "blocker",
            );
            const requesterMove = result.transaction.moves.find(
                (m) => m.entityId === "requester",
            );
            assert.ok(blockerMove, "Should include blocker move");
            assert.ok(requesterMove, "Should include requester move");
            assert.deepStrictEqual(blockerMove!.from, { x: 11, y: 8 });
            assert.deepStrictEqual(blockerMove!.to, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.from, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.to, { x: 11, y: 8 });
        });

        it("cycles with a boxed-in blocker even when the requester is itself in transit", () => {
            const { root } = createTestWorld();
            // Same boxed-in cycle as above, but the requester is walking (a moveTo at its
            // queue head). scoreCandidateTile rejects the requester's own tile as a push
            // target (it's transient), so the cycle is found only via the explicit
            // cycle-back terminator — this pins that path.
            const requester = createAgent("requester", root, 10, 8, 100);
            getBehaviorAgent(requester)!.actionQueue = [
                { type: "moveTo", target: { x: 11, y: 8 } },
            ];
            createAgent("blocker", root, 11, 8, 5);
            createWall("wall-east", root, 12, 8);
            createWall("wall-south", root, 11, 9);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(result.kind === "success", "should return a cycle");
            assert.strictEqual(result.transaction.isCycle, true);
            assert.strictEqual(result.transaction.moves.length, 2);
            const blockerMove = result.transaction.moves.find(
                (m) => m.entityId === "blocker",
            );
            assert.deepStrictEqual(blockerMove!.to, { x: 10, y: 8 });
        });

        it("returns a free beneficial swap when blocker is heading into the requester's tile", () => {
            const { root } = createTestWorld();
            // Equal utility: dominance would refuse (5 > 5 is false). But the blocker
            // is itself trying to step into the requester's tile (its cachedPath[0] is
            // the requester's position), so it's a mutually-beneficial head-on swap.
            const requester = createAgent("requester", root, 10, 8, 5);
            const blocker = createAgent("blocker", root, 11, 8, 5);
            getBehaviorAgent(blocker)!.actionQueue = [
                {
                    type: "moveTo",
                    target: { x: 8, y: 8 },
                    cachedPath: [{ x: 10, y: 8 }],
                },
            ];

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.ok(
                result.kind === "success",
                "Should return a swap transaction even at equal utility",
            );
            assert.strictEqual(result.transaction.isCycle, true);
            assert.strictEqual(result.transaction.beneficialSwap, true);
            assert.strictEqual(result.transaction.moves.length, 2);

            const blockerMove = result.transaction.moves.find(
                (m) => m.entityId === "blocker",
            );
            const requesterMove = result.transaction.moves.find(
                (m) => m.entityId === "requester",
            );
            assert.deepStrictEqual(blockerMove!.from, { x: 11, y: 8 });
            assert.deepStrictEqual(blockerMove!.to, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.from, { x: 10, y: 8 });
            assert.deepStrictEqual(requesterMove!.to, { x: 11, y: 8 });
        });

        it("waits for a same-direction follower's blocker instead of shoving it", () => {
            const { root } = createTestWorld();
            // Blocker is moving, but heading AWAY from the requester (its next step is
            // east, not into the requester) — so it is NOT a head-on beneficial swap.
            // It is in transit (transient), so rather than shove it off its route the
            // requester waits for it to vacate. This is what keeps same-direction
            // traffic queueing rather than the follower barging past the leader.
            const requester = createAgent("requester", root, 10, 8, 5);
            const blocker = createAgent("blocker", root, 11, 8, 5);
            getBehaviorAgent(blocker)!.actionQueue = [
                {
                    type: "moveTo",
                    target: { x: 14, y: 8 },
                    cachedPath: [{ x: 12, y: 8 }],
                },
            ];

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("returns a 2-move chain when blocker must displace a second entity", () => {
            const { root } = createTestWorld();
            // Requester at (8,8) — NOT adjacent to B — targeting (11,8).
            // This prevents A from appearing in B's cardinal-neighbor list,
            // so there is no cycle shortcut: B's only exit is through C.
            const requester = createAgent("requester", root, 8, 8, 100);
            createAgent("blocker-b", root, 11, 8, 5);
            createAgent("blocker-c", root, 12, 8, 5);
            // Block all of B's exits except east (12,8)=C
            createWall("wall-bw", root, 10, 8); // west of B
            createWall("wall-bs", root, 11, 9); // south of B
            // north of B (11,7) is outside the chunk — natural wall
            // C's north (12,7) is also outside — natural wall
            // C's south (12,9) is free — that's where C will move
            // C's west (11,8) is B (visited in chain) — skipped

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(
                result.kind === "success",
                "Should return a 2-move chain",
            );
            assert.strictEqual(result.transaction.isCycle, false);
            assert.strictEqual(result.transaction.moves.length, 2);

            assert.strictEqual(
                result.transaction.moves[0].entityId,
                "blocker-b",
            );
            assert.deepStrictEqual(result.transaction.moves[0].from, {
                x: 11,
                y: 8,
            });
            assert.deepStrictEqual(result.transaction.moves[0].to, {
                x: 12,
                y: 8,
            });

            assert.strictEqual(
                result.transaction.moves[1].entityId,
                "blocker-c",
            );
            assert.deepStrictEqual(result.transaction.moves[1].from, {
                x: 12,
                y: 8,
            });
        });

        it("prefers a free tile over a cycle when both are available", () => {
            const { root } = createTestWorld();
            // Requester at (10,8) adjacent to B at (11,8).
            // B has both: (12,8) free (score 100) AND (10,8)=requester (cycle).
            // The free tile is scored higher so it must be chosen.
            const requester = createAgent("requester", root, 10, 8, 100);
            createAgent("blocker", root, 11, 8, 5);
            // (12,8) and (11,9) are both free — B will pick one immediately

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(result.kind === "success");
            assert.strictEqual(
                result.transaction.isCycle,
                false,
                "Free tile should be preferred over cycle",
            );
        });

        it("returns null when the chain exceeds max depth without finding a free tile", () => {
            const { root } = createTestWorld();
            // Chain: B(11,8) → C(12,8) → D(13,8) → E(14,8) → F(15,8).
            // Requester at (8,8) is NOT adjacent to B, so no cycle shortcut exists.
            // Each entity can only move east. F blocks E's exit at depth=3,
            // which is MAX_CHAIN_DEPTH, so the search gives up.
            const requester = createAgent("requester", root, 8, 8, 100);
            createAgent("b", root, 11, 8, 5);
            createAgent("c", root, 12, 8, 5);
            createAgent("d", root, 13, 8, 5);
            createAgent("e", root, 14, 8, 5);
            createAgent("f", root, 15, 8, 5); // blocks E's only exit

            // Block south of each entity so they can only go east (or west = visited)
            createWall("wall-b-w", root, 10, 8);
            createWall("wall-b-s", root, 11, 9);
            createWall("wall-c-s", root, 12, 9);
            createWall("wall-d-s", root, 13, 9);
            createWall("wall-e-s", root, 14, 9);
            createWall("wall-f-s", root, 15, 9);
            // North of each is automatically a wall (y=7, outside chunk)

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.strictEqual(
                result.kind,
                "noChain",
                "Chain exceeding max depth should return noChain",
            );
        });
    });
});
