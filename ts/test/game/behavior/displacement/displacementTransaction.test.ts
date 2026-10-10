import assert from "node:assert";
import { describe, it } from "node:test";
import { getBehaviorAgent } from "../../../../src/game/component/behaviorAgentComponent.ts";
import {
    MovementStaminaComponentId,
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";
import {
    createEnergyComponent,
    EnergyComponentId,
} from "../../../../src/game/component/energyComponent.ts";
import {
    commitDisplacementTransaction,
    type DisplacementTransaction,
} from "../../../../src/game/behavior/displacement/displacementTransaction.ts";
import type { Point } from "../../../../src/common/point.ts";
import type { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createAgent,
    createTestWorld,
    createWalker,
} from "./displacementTestWorld.ts";

function shoveOne(
    entityId: string,
    from: Point,
    to: Point,
): DisplacementTransaction {
    return { kind: "shove", moves: [{ entityId, from, to }] };
}

/**
 * Walkers turning clockwise around the square (12..13, 9..10), all but the
 * requester at (12,10). Each has one more step after the rotation.
 */
function createTurningSquare(root: Entity): {
    requester: Entity;
    members: Entity[];
    rotation: DisplacementTransaction;
} {
    const requester = createAgent("requester", root, 12, 10);
    const members = [
        createWalker("b", root, 12, 9, [
            { x: 13, y: 9 },
            { x: 14, y: 9 },
        ]),
        createWalker("c", root, 13, 9, [
            { x: 13, y: 10 },
            { x: 13, y: 11 },
        ]),
        createWalker("d", root, 13, 10, [
            { x: 12, y: 10 },
            { x: 11, y: 10 },
        ]),
    ];
    for (const member of members) {
        member.setEcsComponent(createEnergyComponent(100));
    }
    const rotation: DisplacementTransaction = {
        kind: "rotation",
        moves: [
            { entityId: "b", from: { x: 12, y: 9 }, to: { x: 13, y: 9 } },
            { entityId: "c", from: { x: 13, y: 9 }, to: { x: 13, y: 10 } },
            { entityId: "d", from: { x: 13, y: 10 }, to: { x: 12, y: 10 } },
        ],
    };
    return { requester, members, rotation };
}

describe("displacementTransaction", () => {
    describe("commitDisplacementTransaction", () => {
        it("returns false when entity is not at the expected from-position", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);
            b.worldPosition = { x: 13, y: 8 };

            const committed = commitDisplacementTransaction(
                shoveOne("b", { x: 11, y: 8 }, { x: 12, y: 8 }),
                root,
                1,
            );

            assert.strictEqual(committed, false);
        });

        it("returns false when entity has already moved this tick", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);
            recordMove(b.getEcsComponent(MovementStaminaComponentId)!, 5);

            const committed = commitDisplacementTransaction(
                shoveOne("b", { x: 11, y: 8 }, { x: 12, y: 8 }),
                root,
                5,
            );

            assert.strictEqual(committed, false);
            assert.deepStrictEqual(b.worldPosition, { x: 11, y: 8 });
        });

        it("rejects a move that is not to an adjacent tile", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);

            const committed = commitDisplacementTransaction(
                shoveOne("b", { x: 11, y: 8 }, { x: 13, y: 8 }),
                root,
                1,
            );

            assert.strictEqual(committed, false);
            assert.deepStrictEqual(b.worldPosition, { x: 11, y: 8 });
        });

        it("commits a chain last member first", () => {
            const { root } = createTestWorld();
            const b = createAgent("b", root, 11, 8);
            const c = createAgent("c", root, 12, 8);

            const committed = commitDisplacementTransaction(
                {
                    kind: "shove",
                    moves: [
                        {
                            entityId: "b",
                            from: { x: 11, y: 8 },
                            to: { x: 12, y: 8 },
                        },
                        {
                            entityId: "c",
                            from: { x: 12, y: 8 },
                            to: { x: 13, y: 8 },
                        },
                    ],
                },
                root,
                1,
            );

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(b.worldPosition, { x: 12, y: 8 });
            assert.deepStrictEqual(c.worldPosition, { x: 13, y: 8 });
        });

        it("shoves onto the requester's tile and leaves the requester to step itself", () => {
            const { root } = createTestWorld();
            const requester = createAgent("requester", root, 10, 8);
            const b = createAgent("b", root, 11, 8);

            const committed = commitDisplacementTransaction(
                shoveOne("b", { x: 11, y: 8 }, { x: 10, y: 8 }),
                root,
                1,
            );

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(b.worldPosition, { x: 10, y: 8 });
            assert.deepStrictEqual(requester.worldPosition, { x: 10, y: 8 });
        });

        it("shove replans its members and charges them no energy", () => {
            const { root } = createTestWorld();
            const displaced = createAgent("displaced", root, 11, 8);
            displaced.setEcsComponent(createEnergyComponent(100));

            commitDisplacementTransaction(
                shoveOne("displaced", { x: 11, y: 8 }, { x: 12, y: 8 }),
                root,
                1,
            );

            assert.ok(getBehaviorAgent(displaced)!.pendingReplan);
            assert.strictEqual(
                displaced.getEcsComponent(EnergyComponentId)!.energy,
                100,
            );
        });

        it("rotation charges energy, advances routes, and does not replan", () => {
            const { root } = createTestWorld();
            const { requester, members, rotation } = createTurningSquare(root);
            const routesBefore = members.map((member) => {
                const head = getBehaviorAgent(member)!.actionQueue[0];
                assert.ok(head.type === "moveTo");
                return [...head.cachedPath!];
            });

            const committed = commitDisplacementTransaction(rotation, root, 1);

            assert.strictEqual(committed, true);
            assert.deepStrictEqual(requester.worldPosition, { x: 12, y: 10 });
            members.forEach((member, index) => {
                const agent = getBehaviorAgent(member)!;
                const head = agent.actionQueue[0];
                assert.ok(head.type === "moveTo");
                assert.deepStrictEqual(
                    member.worldPosition,
                    routesBefore[index][0],
                );
                assert.deepStrictEqual(
                    head.cachedPath,
                    routesBefore[index].slice(1),
                );
                assert.strictEqual(
                    member.getEcsComponent(EnergyComponentId)!.energy,
                    99,
                );
                assert.strictEqual(agent.pendingReplan, undefined);
            });
        });

        it("rotation moves nobody when a member no longer heads where it did", () => {
            const { root } = createTestWorld();
            const { members, rotation } = createTurningSquare(root);
            const lastMember = members[members.length - 1];
            getBehaviorAgent(lastMember)!.pendingReplan = { kind: "replan" };
            const positionsBefore = members.map((member) => ({
                ...member.worldPosition,
            }));

            const committed = commitDisplacementTransaction(rotation, root, 1);

            assert.strictEqual(committed, false);
            assert.deepStrictEqual(
                members.map((member) => member.worldPosition),
                positionsBefore,
            );
        });
    });
});
