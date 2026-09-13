import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    addThreat,
    createThreatMapComponent,
    ThreatMapComponentId,
} from "../../../../src/game/component/threatMapComponent.ts";
import {
    BehaviorAgentComponentId,
    createBehaviorAgentComponent,
} from "../../../../src/game/component/behaviorAgentComponent.ts";
import { executeAttackTargetAction } from "../../../../src/game/behavior/actions/attackTargetAction.ts";
import { createImmortalComponent } from "../../../../src/game/component/immortalComponent.ts";
import { DeathGameEventType } from "../../../../src/game/entity/event/deathGameEventData.ts";
import type { EntityEvent } from "../../../../src/game/entity/entityEvent.ts";
import type { AttackTarget } from "../../../../src/game/combat/attackTarget.ts";
import type { Point } from "../../../../src/common/point.ts";
import { createEquipmentComponent } from "../../../../src/game/component/equipmentComponent.ts";
import {
    bowItem,
    swordItem,
} from "../../../../src/data/inventory/items/equipment.ts";
import type { InventoryItem } from "../../../../src/data/inventory/inventoryItem.ts";
import { bowAttackProfile } from "../../../../src/data/combat/attackProfileDefinition.ts";
import { addBuilding, createMinimalWorld } from "../../testWorld.ts";
import { AttackTargetKind } from "../../../../src/data/combat/attackProfileDefinition.ts";

/** Matches the goblin prefab, so the arithmetic below is the game's */
const GOBLIN_HP = 10;

function entityTarget(id: string): AttackTarget {
    return { kind: AttackTargetKind.Entity, id };
}

function createTestScene(): { root: Entity; worker: Entity; target: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const target = new Entity("target");

    worker.worldPosition = { x: 10, y: 8 };
    target.worldPosition = { x: 11, y: 8 }; // Adjacent

    target.setEcsComponent(createHealthComponent(10, 10));

    root.addChild(worker);
    root.addChild(target);

    return { root, worker, target };
}

function createCombatScene(): {
    root: Entity;
    worker: Entity;
    target: Entity;
} {
    const scene = createTestScene();
    scene.target.setEcsComponent(createThreatMapComponent());
    scene.target.setEcsComponent(createBehaviorAgentComponent());
    const agent = scene.target.getEcsComponent(BehaviorAgentComponentId)!;
    // The default factory seeds pendingReplan. Clear it so we can observe
    // whether the action under test sets it.
    agent.pendingReplan = undefined;
    return scene;
}

describe("attackTargetAction", () => {
    it("deals damage to target each tick", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("target"),
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "running");

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 9);
    });

    it("completes when target hp reaches 0", () => {
        const { worker, target } = createTestScene();

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        healthComponent.currentHp = 1;

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("target"),
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(healthComponent.currentHp, 0);
    });

    it("names the entity that went missing", () => {
        const { worker } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("nonexistent"),
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "failed");
        assert.deepStrictEqual(
            (result as { cause: { type: string; entityId: string } }).cause,
            { type: "targetGone", entityId: "nonexistent" },
        );
    });

    it("fails out of reach when the target is beyond an unarmed swing", () => {
        const { worker, target } = createTestScene();
        target.worldPosition = { x: 25, y: 25 };

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("target"),
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "failed");
        assert.deepStrictEqual(
            (result as { cause: { type: string } }).cause,
            { type: "outOfReach" },
            "the behavior needs to tell reach apart from a vanished target",
        );
    });

    it("fails out of reach diagonally, where range 1 does not stretch", () => {
        const { worker, target } = createTestScene();
        worker.worldPosition = { x: 10, y: 8 };
        target.worldPosition = { x: 11, y: 9 };

        const result = executeAttackTargetAction(
            { type: "attackTarget", target: entityTarget("target") },
            worker,
            1,
        );

        assert.strictEqual(
            result.kind,
            "failed",
            "a Euclidean range of 1 covers the four cardinal tiles and no more",
        );
    });

    it("reports nothing to attack when the target cannot be hurt", () => {
        const { root, worker } = createTestScene();
        const noHealthTarget = new Entity("noHealthTarget");
        noHealthTarget.worldPosition = { x: 11, y: 8 };
        root.addChild(noHealthTarget);

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("noHealthTarget"),
        };

        const result = executeAttackTargetAction(action, worker, 1);

        assert.strictEqual(result.kind, "failed");
        assert.deepStrictEqual(
            (result as { cause: { type: string } }).cause,
            { type: "nothingToAttack" },
            "it is standing right there, so nothing has gone missing",
        );
    });

    it("continues running while target has hp remaining", () => {
        const { worker, target } = createTestScene();

        const action = {
            type: "attackTarget" as const,
            target: entityTarget("target"),
        };

        // Execute multiple times
        let result = executeAttackTargetAction(action, worker, 1);
        assert.strictEqual(result.kind, "running");

        result = executeAttackTargetAction(action, worker, 2);
        assert.strictEqual(result.kind, "running");

        const healthComponent = target.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 8);
    });

    describe("on lethal hit", () => {
        it("removes the target from its parent when hp reaches 0", () => {
            const { root, worker, target } = createTestScene();
            target.getEcsComponent(HealthComponentId)!.currentHp = 1;

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("target") },
                worker,
                1,
            );

            assert.strictEqual(root.findEntity("target"), null);
        });

        it("leaves an Immortal target in place at 0 hp", () => {
            const { root, worker, target } = createTestScene();
            target.setEcsComponent(createImmortalComponent());
            const healthComponent = target.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 1;

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("target") },
                worker,
                1,
            );

            assert.strictEqual(healthComponent.currentHp, 0);
            assert.strictEqual(root.findEntity("target"), target);
        });

        it("bubbles a death event up the parent chain", () => {
            const { root, worker, target } = createTestScene();
            const healthComponent = target.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 1;

            const events: EntityEvent[] = [];
            root.entityEvent = (event) => events.push(event);

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("target") },
                worker,
                1,
            );

            const death = events.find(
                (e) => e.id === "game" && e.data.type === DeathGameEventType,
            );
            assert.ok(death, "expected a death event to bubble to root");
            assert.strictEqual(
                (death as { data: { payload: { entityId: string } } }).data
                    .payload.entityId,
                "target",
            );
        });

        it("does not bubble a death event for an Immortal target", () => {
            const { root, worker, target } = createTestScene();
            target.setEcsComponent(createImmortalComponent());
            const healthComponent = target.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 1;

            const events: EntityEvent[] = [];
            root.entityEvent = (event) => events.push(event);

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("target") },
                worker,
                1,
            );

            const death = events.find(
                (e) => e.id === "game" && e.data.type === DeathGameEventType,
            );
            assert.strictEqual(death, undefined);
        });
    });

    describe("replan trigger from threat", () => {
        it("triggers replan on the victim when a new attacker becomes top threat", () => {
            const { worker, target } = createCombatScene();
            const action = {
                type: "attackTarget" as const,
                target: entityTarget("target"),
            };

            executeAttackTargetAction(action, worker, 1);

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            assert.ok(
                agent.pendingReplan,
                "victim should replan when first attacker becomes top threat",
            );
        });

        it("does not re-trigger replan when the same attacker stays top threat", () => {
            const { worker, target } = createCombatScene();
            const threat = target.getEcsComponent(ThreatMapComponentId)!;
            // Worker is the established top threat from a prior fight tick.
            addThreat(threat, "worker", 5, 0, target.getRootEntity());

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            agent.pendingReplan = undefined;

            const action = {
                type: "attackTarget" as const,
                target: entityTarget("target"),
            };
            executeAttackTargetAction(action, worker, 1);

            assert.strictEqual(
                agent.pendingReplan,
                undefined,
                "victim should not replan when the top threat is unchanged",
            );
        });

        it("triggers replan when a second attacker overtakes the previous top", () => {
            const { worker, target } = createCombatScene();
            const threat = target.getEcsComponent(ThreatMapComponentId)!;
            // Pre-seed: G2 is the established top. Both amounts land on the
            // intrusion floor, so the tie goes to G2 (insertion order plus
            // strict `>`). After one attack from worker, worker accumulates
            // more and overtakes G2. This couples to attackTargetAction's
            // damage > 0, which is a fair invariant. A no-op attack would be
            // a bug.
            const sceneRoot = target.getRootEntity();
            // G2 must resolve as a live entity or the write-time sweep and
            // getTopThreat both ignore it.
            const otherAttacker = new Entity("G2");
            otherAttacker.worldPosition = { x: 12, y: 8 };
            sceneRoot.addChild(otherAttacker);
            addThreat(threat, "G2", 2, 0, sceneRoot);
            addThreat(threat, "worker", 2, 0, sceneRoot);

            const agent = target.getEcsComponent(BehaviorAgentComponentId)!;
            agent.pendingReplan = undefined;

            const action = {
                type: "attackTarget" as const,
                target: entityTarget("target"),
            };
            executeAttackTargetAction(action, worker, 1);

            assert.ok(
                agent.pendingReplan,
                "victim should replan when a new attacker overtakes the top",
            );
        });
    });

    describe("the attacker's weapon", () => {
        it("hits a building for the weapon's structure damage, not its body damage", () => {
            const { root } = createMinimalWorld();
            const archer = armedWorker("archer", { x: 10, y: 8 });
            root.addChild(archer);
            archer.worldPosition = { x: 10, y: 8 };
            const wall = addBuilding(root, "wall", { x: 12, y: 8 });

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("wall") },
                archer,
                1,
            );

            const health = wall.getEcsComponent(HealthComponentId)!;
            assert.strictEqual(
                health.currentHp,
                health.maxHp - bowAttackProfile.structureDamage,
                `a bow should spend its structure damage (${bowAttackProfile.structureDamage}) on a wall, not its body damage (${bowAttackProfile.damage})`,
            );
        });

        it("reaches five tiles with a bow where bare hands reach one", () => {
            const { root } = createMinimalWorld();
            const archer = armedWorker("archer", { x: 10, y: 8 });
            root.addChild(archer);
            archer.worldPosition = { x: 10, y: 8 };

            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createHealthComponent(GOBLIN_HP, GOBLIN_HP));
            root.addChild(goblin);
            goblin.worldPosition = { x: 15, y: 8 };

            const result = executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("goblin") },
                archer,
                1,
            );

            assert.strictEqual(result.kind, "running");
            assert.strictEqual(
                goblin.getEcsComponent(HealthComponentId)!.currentHp,
                GOBLIN_HP - bowAttackProfile.damage,
                "the hit lands in the tick it is ordered, five tiles away",
            );
        });

        it("fails for want of a line of sight when a building blocks the shot", () => {
            const { root } = createMinimalWorld();
            const archer = armedWorker("archer", { x: 10, y: 8 });
            root.addChild(archer);
            archer.worldPosition = { x: 10, y: 8 };
            addBuilding(root, "granary", { x: 12, y: 8 });

            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createHealthComponent(GOBLIN_HP, GOBLIN_HP));
            root.addChild(goblin);
            goblin.worldPosition = { x: 14, y: 8 };

            const result = executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("goblin") },
                archer,
                1,
            );

            assert.strictEqual(result.kind, "failed");
            assert.deepStrictEqual(
                (result as { cause: { type: string } }).cause,
                { type: "noLineOfSight" },
            );
            assert.strictEqual(
                goblin.getEcsComponent(HealthComponentId)!.currentHp,
                10,
                "a blocked shot is not fired at all, so nothing is hurt",
            );
        });

        it("adds the weapon's threat rather than the damage it dealt", () => {
            const { root } = createMinimalWorld();
            const archer = armedWorker("archer", { x: 10, y: 8 });
            root.addChild(archer);
            archer.worldPosition = { x: 10, y: 8 };

            const goblin = new Entity("goblin");
            goblin.setEcsComponent(createHealthComponent(GOBLIN_HP, GOBLIN_HP));
            goblin.setEcsComponent(createThreatMapComponent());
            root.addChild(goblin);
            goblin.worldPosition = { x: 14, y: 8 };

            // Seeded first, because a brand new entry is floored at the
            // intrusion amount and would hide what this hit contributed
            const seeded = 20;
            const threat = goblin.getEcsComponent(ThreatMapComponentId)!;
            addThreat(threat, "archer", seeded, 1, root);

            executeAttackTargetAction(
                { type: "attackTarget", target: entityTarget("goblin") },
                archer,
                1,
            );

            assert.strictEqual(
                threat.threat["archer"].amount,
                seeded + bowAttackProfile.threat,
                `the entry should grow by the bow's threat (${bowAttackProfile.threat}), not by the damage it dealt (${bowAttackProfile.damage})`,
            );
        });

        it("refuses to aim a weapon at something it cannot be aimed at", () => {
            // No weapon in the game accepts a tile yet, so a planner handing a
            // sword one is a bug rather than a situation. It has to fail loudly
            // instead of quietly swinging at the ground
            const { root } = createMinimalWorld();
            const swordsman = armedWorker(
                "swordsman",
                { x: 10, y: 8 },
                swordItem,
            );
            root.addChild(swordsman);
            swordsman.worldPosition = { x: 10, y: 8 };

            const result = executeAttackTargetAction(
                {
                    type: "attackTarget",
                    target: {
                        kind: AttackTargetKind.Tile,
                        point: { x: 11, y: 8 },
                    },
                },
                swordsman,
                1,
            );

            assert.strictEqual(result.kind, "failed");
            assert.deepStrictEqual(
                (result as { cause: { type: string } }).cause,
                { type: "unknown" },
            );
        });
    });
});

/**
 * A worker carrying a weapon in its main hand. Built with a real equipment
 * component so the profile is resolved the same way the game resolves it
 */
function armedWorker(
    id: string,
    position: Point,
    weapon: InventoryItem = bowItem,
): Entity {
    const worker = new Entity(id);
    worker.worldPosition = position;
    const equipment = createEquipmentComponent();
    equipment.slots.primary = weapon;
    worker.setEcsComponent(equipment);
    return worker;
}
