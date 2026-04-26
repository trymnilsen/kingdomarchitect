import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createEngageInCombatBehavior } from "../../../src/game/behavior/behaviors/engageInCombatBehavior.ts";
import {
    addThreat,
    createThreatMapComponent,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";

function createVictim(): { root: Entity; victim: Entity } {
    const root = new Entity("root");
    const victim = new Entity("victim");
    victim.worldPosition = { x: 12, y: 8 };
    victim.setEcsComponent(createThreatMapComponent());
    root.addChild(victim);
    return { root, victim };
}

function attachAttacker(
    root: Entity,
    id: string,
    x: number,
    y: number,
): Entity {
    const attacker = new Entity(id);
    attacker.worldPosition = { x, y };
    root.addChild(attacker);
    return attacker;
}

describe("engageInCombatBehavior", () => {
    describe("expand", () => {
        it("picks the highest-amount threat when multiple attackers exist", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            attachAttacker(root, "G2", 19, 8);
            addThreat(threat, "G1", 3, 0);
            addThreat(threat, "G2", 7, 0);

            const actions = behavior.expand(victim);
            const attack = actions.find(
                (a) => a.type === "attackTarget",
            ) as { type: "attackTarget"; targetId: string } | undefined;

            assert.ok(attack, "expand must include an attackTarget action");
            assert.strictEqual(attack.targetId, "G2");
        });

        it("switches target when accumulated threat amounts shift", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            attachAttacker(root, "G2", 19, 8);
            addThreat(threat, "G1", 5, 0);
            addThreat(threat, "G2", 2, 0);

            const firstActions = behavior.expand(victim);
            const firstAttack = firstActions.find(
                (a) => a.type === "attackTarget",
            ) as { type: "attackTarget"; targetId: string } | undefined;
            assert.strictEqual(firstAttack?.targetId, "G1");

            // G2 piles on and overtakes
            addThreat(threat, "G2", 10, 1);

            const secondActions = behavior.expand(victim);
            const secondAttack = secondActions.find(
                (a) => a.type === "attackTarget",
            ) as { type: "attackTarget"; targetId: string } | undefined;
            assert.strictEqual(secondAttack?.targetId, "G2");
        });
    });

    describe("isValid", () => {
        it("returns false when the top-threat entity is not in the world", () => {
            const behavior = createEngageInCombatBehavior();
            const { victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            // G1 is never attached to root — represents a despawned attacker
            // whose threat entry lingers
            addThreat(threat, "G1", 5, 0);

            assert.strictEqual(behavior.isValid(victim), false);
        });

        it("returns true when the top-threat entity is in the world", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            addThreat(threat, "G1", 5, 0);

            assert.strictEqual(behavior.isValid(victim), true);
        });
    });

    describe("action shape", () => {
        it("returns moveTo and attackTarget actions for the top threat", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            // Place attacker far from victim so a moveTo step is meaningful
            attachAttacker(root, "G1", 20, 15);
            addThreat(threat, "G1", 5, 0);

            const actions = behavior.expand(victim);
            const hasMoveTo = actions.some((a) => a.type === "moveTo");
            const attack = actions.find(
                (a) => a.type === "attackTarget",
            ) as { type: "attackTarget"; targetId: string } | undefined;

            assert.ok(hasMoveTo, "expand should include a moveTo action");
            assert.ok(attack, "expand should include an attackTarget action");
            assert.strictEqual(attack.targetId, "G1");
        });
    });
});
