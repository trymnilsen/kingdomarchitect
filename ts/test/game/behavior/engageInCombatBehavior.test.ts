import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createEngageInCombatBehavior } from "../../../src/game/behavior/behaviors/engageInCombatBehavior.ts";
import {
    addThreat,
    createThreatMapComponent,
    refreshIntrusionThreat,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";
import { createGameTimeComponent } from "../../../src/game/component/gameTimeComponent.ts";

function createVictim(): {
    root: Entity;
    victim: Entity;
    time: { tick: number };
} {
    const root = new Entity("root");
    const time = { tick: 0 };
    root.setEcsComponent(createGameTimeComponent(time));
    const victim = new Entity("victim");
    victim.worldPosition = { x: 12, y: 8 };
    victim.setEcsComponent(createThreatMapComponent());
    root.addChild(victim);
    return { root, victim, time };
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
            // Amounts above the intrusion floor so the ordering is the
            // amounts' own, not the floor's.
            addThreat(threat, "G1", 12, 0, root);
            addThreat(threat, "G2", 15, 0, root);

            const actions = behavior.expand(victim);
            const attack = actions.find((a) => a.type === "attackTarget") as
                | { type: "attackTarget"; targetId: string }
                | undefined;

            assert.ok(attack, "expand must include an attackTarget action");
            assert.strictEqual(attack.targetId, "G2");
        });

        it("switches target when accumulated threat amounts shift", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim, time } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            attachAttacker(root, "G2", 19, 8);
            addThreat(threat, "G1", 15, 0, root);
            addThreat(threat, "G2", 12, 0, root);

            const firstActions = behavior.expand(victim);
            const firstAttack = firstActions.find(
                (a) => a.type === "attackTarget",
            ) as { type: "attackTarget"; targetId: string } | undefined;
            assert.strictEqual(firstAttack?.targetId, "G1");

            // G2 piles on and overtakes
            time.tick = 1;
            addThreat(threat, "G2", 10, 1, root);

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
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            // G1 is never attached to root — represents a despawned attacker
            // whose threat entry lingers
            addThreat(threat, "G1", 5, 0, root);

            assert.strictEqual(behavior.isValid(victim), false);
        });

        it("returns true when the top-threat entity is in the world", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            addThreat(threat, "G1", 5, 0, root);

            assert.strictEqual(behavior.isValid(victim), true);
        });

        it("goes invalid once the entry has decayed to nothing", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim, time } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);
            // A small hit is floored to INTRUSION_THREAT (10), so the entry
            // decays out after 10 ticks of silence.
            addThreat(threat, "G1", 1, 0, root);

            time.tick = 9;
            assert.strictEqual(behavior.isValid(victim), true);
            time.tick = 10;
            assert.strictEqual(behavior.isValid(victim), false);
        });
    });

    describe("utility", () => {
        it("is 90 for a damage-sourced top threat and 75 for intrusion", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            attachAttacker(root, "G1", 18, 8);

            refreshIntrusionThreat(threat, "G1", 0, root);
            assert.strictEqual(behavior.utility(victim), 75);

            addThreat(threat, "G1", 3, 0, root);
            assert.strictEqual(behavior.utility(victim), 90);
        });
    });

    describe("action shape", () => {
        it("returns moveTo and attackTarget actions for the top threat", () => {
            const behavior = createEngageInCombatBehavior();
            const { root, victim } = createVictim();
            const threat = victim.getEcsComponent(ThreatMapComponentId)!;
            // Place attacker far from victim so a moveTo step is meaningful
            attachAttacker(root, "G1", 20, 15);
            addThreat(threat, "G1", 5, 0, root);

            const actions = behavior.expand(victim);
            const hasMoveTo = actions.some((a) => a.type === "moveTo");
            const attack = actions.find((a) => a.type === "attackTarget") as
                | { type: "attackTarget"; targetId: string }
                | undefined;

            assert.ok(hasMoveTo, "expand should include a moveTo action");
            assert.ok(attack, "expand should include an attackTarget action");
            assert.strictEqual(attack.targetId, "G1");
        });
    });
});
