import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../src/common/point.ts";
import { AttackTargetKind } from "../../../../src/data/combat/attackProfileDefinition.ts";
import { bowItem } from "../../../../src/data/inventory/items/equipment.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import { planApproach } from "../../../../src/game/behavior/actions/actionApproach.ts";
import { createEquipmentComponent } from "../../../../src/game/component/equipmentComponent.ts";
import { createHealthComponent } from "../../../../src/game/component/healthComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { collectableItemPrefab } from "../../../../src/game/prefab/collectableItemPrefab.ts";
import { addBuilding, createMinimalWorld } from "../../testWorld.ts";

function hauler(root: Entity, position: Point): Entity {
    const worker = new Entity("hauler");
    root.addChild(worker);
    worker.worldPosition = position;
    return worker;
}

function pile(root: Entity, position: Point): Entity {
    const entity = collectableItemPrefab(woodResourceItem, 4, 1);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

function archerAndGoblin(
    archerAt: Point,
    goblinAt: Point,
): { root: Entity; archer: Entity } {
    const { root } = createMinimalWorld();

    const archer = new Entity("archer");
    const equipment = createEquipmentComponent();
    equipment.slots.primary = bowItem;
    archer.setEcsComponent(equipment);
    root.addChild(archer);
    archer.worldPosition = archerAt;

    const goblin = new Entity("goblin");
    goblin.setEcsComponent(createHealthComponent(10, 10));
    root.addChild(goblin);
    goblin.worldPosition = goblinAt;

    return { root, archer };
}

describe("planApproach", () => {
    describe("picking up a ground pile", () => {
        it("needs no walk for a hauler standing on the pile", () => {
            // The live-lock this module exists to prevent: the walk used to
            // accept this tile while the pickup refused it
            const { root } = createMinimalWorld();
            const worker = hauler(root, { x: 12, y: 8 });
            const target = pile(root, { x: 12, y: 8 });

            const approach = planApproach(
                { type: "pickupFromGround", pileEntityId: target.id },
                worker,
            );

            assert.strictEqual(approach, null);
        });

        it("walks a distant hauler until it touches the pile", () => {
            const { root } = createMinimalWorld();
            const worker = hauler(root, { x: 4, y: 3 });
            const target = pile(root, { x: 12, y: 8 });

            const approach = planApproach(
                { type: "pickupFromGround", pileEntityId: target.id },
                worker,
            );

            assert.deepStrictEqual(approach, {
                type: "moveTo",
                target: { x: 12, y: 8 },
                goal: { kind: "touch" },
            });
        });

        it("leaves a vanished pile to the pickup, which reports it gone", () => {
            const { root } = createMinimalWorld();
            const worker = hauler(root, { x: 4, y: 3 });

            const approach = planApproach(
                { type: "pickupFromGround", pileEntityId: "collectable404" },
                worker,
            );

            assert.strictEqual(approach, null);
        });
    });

    describe("dropping at a chosen tile", () => {
        it("walks onto the tile itself, not merely beside it", () => {
            const { root } = createMinimalWorld();
            const worker = hauler(root, { x: 12, y: 8 });

            const approach = planApproach(
                { type: "dropHeld", destination: { x: 13, y: 8 } },
                worker,
            );

            assert.deepStrictEqual(approach, {
                type: "moveTo",
                target: { x: 13, y: 8 },
                goal: { kind: "on" },
            });
        });
    });

    describe("attacking", () => {
        const aimAtGoblin = {
            type: "attackTarget" as const,
            target: { kind: AttackTargetKind.Entity, id: "goblin" },
        };

        it("closes in on a target beyond the bow's range", () => {
            const { archer } = archerAndGoblin(
                { x: 4, y: 10 },
                { x: 14, y: 10 },
            );

            const approach = planApproach(aimAtGoblin, archer);

            assert.deepStrictEqual(approach, {
                type: "moveTo",
                target: { x: 14, y: 10 },
                goal: { kind: "attack", target: aimAtGoblin.target },
            });
        });

        it("looks for an angle when a building blocks a shot in range", () => {
            const { root, archer } = archerAndGoblin(
                { x: 10, y: 8 },
                { x: 14, y: 8 },
            );
            addBuilding(root, "granary", { x: 12, y: 8 });

            const approach = planApproach(aimAtGoblin, archer);

            assert.notStrictEqual(
                approach,
                null,
                "in range but no line of sight, so the archer has to move",
            );
        });

        it("shoots from where it stands with a clear shot in range", () => {
            const { archer } = archerAndGoblin(
                { x: 10, y: 8 },
                { x: 14, y: 8 },
            );

            assert.strictEqual(planApproach(aimAtGoblin, archer), null);
        });
    });
});
