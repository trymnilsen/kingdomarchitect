import assert from "node:assert";
import { describe, it } from "node:test";
import { distance, type Point } from "../../../src/common/point.ts";
import { bowItem } from "../../../src/data/inventory/items/equipment.ts";
import { hasLineOfSight } from "../../../src/game/combat/lineOfSight.ts";
import { AttackTargetKind } from "../../../src/data/combat/attackProfileDefinition.ts";
import {
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { EquipmentComponentId } from "../../../src/game/component/equipmentComponent.ts";
import { HealthComponentId } from "../../../src/game/component/healthComponent.ts";
import {
    addThreat,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import { trainingDummyPrefab } from "../../../src/game/prefab/trainingDummyPrefab.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { ScenarioHarness } from "./scenarioHarness.ts";

/**
 * A worker with a bow and something to shoot at. A training dummy rather than a
 * goblin, so it stands still and never dies while the archer picks where to
 * stand
 */
function archerAgainstDummy(
    harness: ScenarioHarness,
    archerAt: Point,
    dummyAt: Point,
): { archer: Entity; dummy: Entity } {
    const archer = harness.addWorker("archer", archerAt);
    archer.getEcsComponent(EquipmentComponentId)!.slots.primary = bowItem;

    const dummy = trainingDummyPrefab();
    harness.root.addChild(dummy);
    dummy.worldPosition = dummyAt;

    return { archer, dummy };
}

/** The archer picks the fight itself, the way it would after being shot at */
function provoke(
    harness: ScenarioHarness,
    archer: Entity,
    dummy: Entity,
): void {
    addThreat(
        archer.getEcsComponent(ThreatMapComponentId)!,
        dummy.id,
        20,
        harness.currentTick,
        harness.root,
    );
    requestReplan(archer);
}

/** What the HUD sends when the player picks a target and confirms the attack */
function orderAttack(archer: Entity, dummy: Entity): void {
    getBehaviorAgent(archer)!.playerCommand = {
        action: "attack",
        target: { kind: AttackTargetKind.Entity, id: dummy.id },
    };
    requestReplan(archer);
}

function hp(entity: Entity): number {
    return entity.getEcsComponent(HealthComponentId)!.currentHp;
}

/** Runs the fight and reports how close the archer ever got. */
function fight(
    harness: ScenarioHarness,
    archer: Entity,
    dummy: Entity,
    ticks: number,
): number {
    let closest = distance(archer.worldPosition, dummy.worldPosition);
    for (let i = 0; i < ticks; i++) {
        harness.tick();
        closest = Math.min(
            closest,
            distance(archer.worldPosition, dummy.worldPosition),
        );
    }
    return closest;
}

describe("archer scenario", () => {
    it("shoots from range instead of closing to arm's length", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const { archer, dummy } = archerAgainstDummy(
            harness,
            { x: 12, y: 12 },
            { x: 22, y: 12 },
        );
        provoke(harness, archer, dummy);

        const closest = fight(harness, archer, dummy, 12);

        assert.ok(
            hp(dummy) < 10,
            `the dummy should have been hit, hp is ${hp(dummy)}`,
        );
        assert.ok(
            closest > 1,
            `the archer should never have closed to melee, got within ${closest}`,
        );
        assert.ok(
            closest <= 5,
            `the archer should have walked into bow range, got within ${closest}`,
        );
    });

    it("walks around a building rather than shooting through it", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const { archer, dummy } = archerAgainstDummy(
            harness,
            { x: 12, y: 12 },
            { x: 22, y: 12 },
        );
        provoke(harness, archer, dummy);
        // Right in front of the dummy, so every tile on the straight approach
        // that is close enough to shoot from is also behind cover
        harness.placeBuilding("granary", { x: 20, y: 12 });

        const closest = fight(harness, archer, dummy, 20);

        assert.strictEqual(
            hasLineOfSight(harness.root, { x: 18, y: 12 }, dummy.worldPosition),
            false,
            "the straight approach really is blocked, or this proves nothing",
        );
        assert.ok(
            hp(dummy) < 10,
            `the archer should have found an angle, dummy hp is ${hp(dummy)}`,
        );
        assert.strictEqual(
            hasLineOfSight(
                harness.root,
                archer.worldPosition,
                dummy.worldPosition,
            ),
            true,
            "the archer settled somewhere it can actually see the target from",
        );
        assert.ok(
            closest > 1,
            `the archer should still never have closed to melee, got within ${closest}`,
        );
    });

    it("walks into range for a target the player picked from outside it", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const { archer, dummy } = archerAgainstDummy(
            harness,
            { x: 12, y: 12 },
            { x: 26, y: 12 },
        );
        // Nothing has threatened the archer, so the walk and the shot can only
        // come from the order
        orderAttack(archer, dummy);

        const closest = fight(harness, archer, dummy, 16);

        assert.ok(
            hp(dummy) < 10,
            `the ordered attack should have landed, dummy hp is ${hp(dummy)}`,
        );
        assert.ok(
            closest <= 5,
            `the archer should have walked into bow range, got within ${closest}`,
        );
    });
});
