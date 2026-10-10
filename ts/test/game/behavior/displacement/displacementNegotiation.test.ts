import assert from "node:assert";
import { describe, it } from "node:test";
import { getBehaviorAgent } from "../../../../src/game/component/behaviorAgentComponent.ts";
import { recordMove } from "../../../../src/game/component/movementStaminaComponent.ts";
import { negotiateDisplacement } from "../../../../src/game/behavior/displacement/displacementNegotiation.ts";
import {
    createAgent,
    createTestWorld,
    createWall,
    createWalker,
} from "./displacementTestWorld.ts";

describe("displacementNegotiation", () => {
    describe("negotiateDisplacement", () => {
        it("returns refused when a settled blocker's cost exceeds requester priority", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 5);
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

        it("waits when the blocker has already moved this tick", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 100);
            const blocker = createAgent("blocker", root, 11, 8, 0);
            recordMove(blocker.getEcsComponent("MovementStamina")!, 5);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                5,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("shoves a boxed-in blocker onto the requester's tile", () => {
            const { root } = createTestWorld();
            // The world wall at y=7 closes the blocker's north side
            const requester = createAgent("requester", root, 10, 8, 100);
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

            assert.deepStrictEqual(result, {
                kind: "shove",
                moves: [
                    {
                        entityId: "blocker",
                        from: { x: 11, y: 8 },
                        to: { x: 10, y: 8 },
                    },
                ],
            });
        });

        it("shoves a boxed-in blocker onto a walking requester's tile", () => {
            const { root } = createTestWorld();
            // scoreCandidateTile rejects a walker's tile, so only the explicit
            // cycle-back in findBestChain can find this
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

            assert.ok(result.kind === "shove");
            assert.deepStrictEqual(
                result.moves.map((move) => move.to),
                [requester.worldPosition],
            );
        });

        it("rotates head-on with a walker of equal utility", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 5);
            createWalker("blocker", root, 11, 8, [
                { x: 10, y: 8 },
                { x: 9, y: 8 },
            ]);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.deepStrictEqual(result, {
                kind: "rotation",
                moves: [
                    {
                        entityId: "blocker",
                        from: { x: 11, y: 8 },
                        to: { x: 10, y: 8 },
                    },
                ],
            });
        });

        it("rotates four walkers turning around a 2x2 square", () => {
            const { root } = createTestWorld();
            // Each wants the next tile clockwise, and no pair is head-on
            const requester = createWalker("requester", root, 12, 10, [
                { x: 12, y: 9 },
            ]);
            createWalker("b", root, 12, 9, [{ x: 13, y: 9 }]);
            createWalker("c", root, 13, 9, [{ x: 13, y: 10 }]);
            createWalker("d", root, 13, 10, [{ x: 12, y: 10 }]);

            const result = negotiateDisplacement(
                requester,
                { x: 12, y: 9 },
                5,
                root,
                1,
            );

            assert.deepStrictEqual(result, {
                kind: "rotation",
                moves: [
                    {
                        entityId: "b",
                        from: { x: 12, y: 9 },
                        to: { x: 13, y: 9 },
                    },
                    {
                        entityId: "c",
                        from: { x: 13, y: 9 },
                        to: { x: 13, y: 10 },
                    },
                    {
                        entityId: "d",
                        from: { x: 13, y: 10 },
                        to: { x: 12, y: 10 },
                    },
                ],
            });
        });

        it("waits behind a loop it only feeds into", () => {
            const { root } = createTestWorld();
            // The square turns on its own, with the requester queued outside
            const requester = createWalker("requester", root, 11, 9, [
                { x: 12, y: 9 },
            ]);
            createWalker("b", root, 12, 9, [{ x: 13, y: 9 }]);
            createWalker("c", root, 13, 9, [{ x: 13, y: 10 }]);
            createWalker("d", root, 13, 10, [{ x: 12, y: 10 }]);
            createWalker("e", root, 12, 10, [{ x: 12, y: 9 }]);

            const result = negotiateDisplacement(
                requester,
                { x: 12, y: 9 },
                5,
                root,
                1,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("does not rotate with a walker that is about to replan", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 5);
            const blocker = createWalker("blocker", root, 11, 8, [
                { x: 10, y: 8 },
            ]);
            getBehaviorAgent(blocker)!.pendingReplan = { kind: "replan" };

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("does not rotate a walker off a goal it has already reached", () => {
            const { root } = createTestWorld();
            // Its path still leads through the requester, but it touches its
            // target from where it stands and finishes on its own turn
            const requester = createAgent("requester", root, 10, 8, 5);
            getBehaviorAgent(
                createAgent("blocker", root, 11, 8, 5),
            )!.actionQueue = [
                {
                    type: "moveTo",
                    target: { x: 12, y: 8 },
                    goal: { kind: "touch" },
                    cachedPath: [
                        { x: 10, y: 8 },
                        { x: 10, y: 9 },
                    ],
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

        it("waits for a walker heading the same way instead of shoving it", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 5);
            createWalker("blocker", root, 11, 8, [
                { x: 12, y: 8 },
                { x: 13, y: 8 },
            ]);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                5,
                root,
                1,
            );

            assert.strictEqual(result.kind, "wait");
        });

        it("shoves through a second settled worker when the first has nowhere else to go", () => {
            const { root } = createTestWorld();
            // The requester stands apart from b, so b cannot take its tile
            const requester = createAgent("requester", root, 8, 8, 100);
            createAgent("blocker-b", root, 11, 8, 5);
            createAgent("blocker-c", root, 12, 8, 5);
            createWall("wall-bw", root, 10, 8);
            createWall("wall-bs", root, 11, 9);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(result.kind === "shove");
            assert.deepStrictEqual(
                result.moves.map((move) => move.entityId),
                ["blocker-b", "blocker-c"],
            );
            assert.deepStrictEqual(result.moves[0].to, result.moves[1].from);
        });

        it("prefers a free tile over taking the requester's tile", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8, 100);
            createAgent("blocker", root, 11, 8, 5);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.ok(result.kind === "shove");
            assert.notDeepStrictEqual(
                result.moves[0].to,
                requester.worldPosition,
            );
        });

        it("gives up when the chain would be deeper than allowed", () => {
            const { root } = createTestWorld();
            // A row of settled workers that can each only move east, with
            // walls below and the world wall above
            const requester = createAgent("requester", root, 8, 8, 100);
            for (const [index, id] of ["b", "c", "d", "e", "f"].entries()) {
                createAgent(id, root, 11 + index, 8, 5);
                createWall(`wall-${id}-s`, root, 11 + index, 9);
            }
            createWall("wall-b-w", root, 10, 8);

            const result = negotiateDisplacement(
                requester,
                { x: 11, y: 8 },
                100,
                root,
                1,
            );

            assert.strictEqual(result.kind, "noChain");
        });
    });
});
