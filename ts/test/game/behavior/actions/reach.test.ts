import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import { bowItem } from "../../../../src/data/inventory/items/equipment.ts";
import { resolveReach } from "../../../../src/game/behavior/actions/reach.ts";
import { createEquipmentComponent } from "../../../../src/game/component/equipmentComponent.ts";
import { createHealthComponent } from "../../../../src/game/component/healthComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { addBuilding, createMinimalWorld } from "../../testWorld.ts";
import { AttackTargetKind } from "../../../../src/data/combat/attackProfileDefinition.ts";

/**
 * An archer and the goblin it is after, placed far enough apart that the bow's
 * reach is the only thing that could stop the approach early
 */
function archerAndQuarry(quarryAt: Point): {
    root: Entity;
    archer: Entity;
} {
    const { root } = createMinimalWorld();

    const archer = new Entity("archer");
    const equipment = createEquipmentComponent();
    equipment.slots.primary = bowItem;
    archer.setEcsComponent(equipment);
    root.addChild(archer);
    archer.worldPosition = { x: 4, y: 10 };

    const quarry = new Entity("goblin");
    quarry.setEcsComponent(createHealthComponent(10, 10));
    root.addChild(quarry);
    quarry.worldPosition = quarryAt;

    return { root, archer };
}

describe("resolveReach", () => {
    const target: Point = { x: 12, y: 8 };

    describe("touch", () => {
        const inTouch = resolveReach(
            { kind: "touch" },
            new Entity("worker"),
            target,
        );

        it("accepts standing on the target, so a pile underfoot is picked up", () => {
            assert.strictEqual(inTouch({ x: 12, y: 8 }), true);
        });

        it("accepts all four cardinal neighbours", () => {
            assert.strictEqual(inTouch({ x: 11, y: 8 }), true);
            assert.strictEqual(inTouch({ x: 13, y: 8 }), true);
            assert.strictEqual(inTouch({ x: 12, y: 7 }), true);
            assert.strictEqual(inTouch({ x: 12, y: 9 }), true);
        });

        it("rejects a diagonal neighbour", () => {
            assert.strictEqual(inTouch({ x: 13, y: 9 }), false);
        });
    });

    describe("near", () => {
        const isNear = resolveReach(
            { kind: "near" },
            new Entity("goblin"),
            target,
        );

        it("accepts a diagonal neighbour, since warmth reaches the corners", () => {
            assert.strictEqual(isNear({ x: 11, y: 7 }), true);
            assert.strictEqual(isNear({ x: 13, y: 9 }), true);
        });

        it("rejects two tiles out", () => {
            assert.strictEqual(isNear({ x: 14, y: 8 }), false);
            assert.strictEqual(isNear({ x: 13, y: 10 }), false);
        });
    });

    describe("attack", () => {
        it("is satisfied well short of the target for an archer", () => {
            const { archer } = archerAndQuarry({ x: 14, y: 10 });
            const isGoal = resolveReach(
                {
                    kind: "attack",
                    target: { kind: AttackTargetKind.Entity, id: "goblin" },
                },
                archer,
                { x: 14, y: 10 },
            );

            assert.strictEqual(
                isGoal({ x: 9, y: 10 }),
                true,
                "five tiles out is close enough with a bow, so the walk stops there",
            );
            assert.strictEqual(
                isGoal({ x: 8, y: 10 }),
                false,
                "six tiles out is still too far",
            );
        });

        it("follows the target rather than the point the move was planned against", () => {
            // The destination is where the goblin stood at plan time. It has
            // since walked four tiles closer
            const { archer } = archerAndQuarry({ x: 10, y: 10 });
            const isGoal = resolveReach(
                {
                    kind: "attack",
                    target: { kind: AttackTargetKind.Entity, id: "goblin" },
                },
                archer,
                { x: 14, y: 10 },
            );

            assert.strictEqual(isGoal({ x: 5, y: 10 }), true);
        });

        it("is not satisfied by a tile with no shot, however close", () => {
            const { root, archer } = archerAndQuarry({ x: 12, y: 10 });
            addBuilding(root, "wall", { x: 10, y: 10 });

            const isGoal = resolveReach(
                {
                    kind: "attack",
                    target: { kind: AttackTargetKind.Entity, id: "goblin" },
                },
                archer,
                { x: 12, y: 10 },
            );

            assert.strictEqual(
                isGoal({ x: 8, y: 10 }),
                false,
                "in range but behind the wall, so the archer keeps looking for an angle",
            );
            assert.strictEqual(
                isGoal({ x: 8, y: 13 }),
                true,
                "off to the side the shot is clear",
            );
        });

        it("accepts nothing once the target is gone", () => {
            const { archer } = archerAndQuarry({ x: 12, y: 10 });
            const isGoal = resolveReach(
                {
                    kind: "attack",
                    target: { kind: AttackTargetKind.Entity, id: "ghost" },
                },
                archer,
                { x: 12, y: 10 },
            );

            assert.strictEqual(isGoal({ x: 11, y: 10 }), false);
        });
    });
});
