import { describe, it } from "node:test";
import assert from "node:assert";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createPerformPlayerCommandBehavior } from "../../../src/game/behavior/behaviors/performPlayerCommandBehavior.ts";
import { createBehaviorTestEntity } from "./behaviorTestHelpers.ts";
import { getBehaviorAgent } from "../../../src/game/component/behaviorAgentComponent.ts";
import { AttackTargetKind } from "../../../src/data/combat/attackProfileDefinition.ts";

function createAttackScene(): {
    root: Entity;
    attacker: Entity;
    target: Entity;
} {
    const root = new Entity("root");
    const attacker = createBehaviorTestEntity("attacker", 10, 8);
    const target = new Entity("target");
    target.worldPosition = { x: 15, y: 12 };
    root.addChild(attacker);
    root.addChild(target);
    return { root, attacker, target };
}

describe("PerformPlayerCommandBehavior", () => {
    describe("expand", () => {
        it("expands attack command to attackTarget + clearPlayerCommand", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const { attacker, target } = createAttackScene();
            const agent = getBehaviorAgent(attacker);
            agent!.playerCommand = {
                action: "attack",
                target: { kind: AttackTargetKind.Entity, id: target.id },
            };

            const actions = behavior.expand(attacker);

            assert.deepStrictEqual(actions, [
                {
                    type: "attackTarget",
                    target: { kind: AttackTargetKind.Entity, id: target.id },
                },
                { type: "clearPlayerCommand" },
            ]);
        });

        it("clears attack command and returns empty array when target not found", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const { attacker } = createAttackScene();
            const agent = getBehaviorAgent(attacker);
            agent!.playerCommand = {
                action: "attack",
                target: { kind: AttackTargetKind.Entity, id: "nonexistent" },
            };

            const actions = behavior.expand(attacker);

            assert.strictEqual(actions.length, 0);
            assert.strictEqual(agent!.playerCommand, undefined);
        });

        it("returns empty array and clears command for pickup", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "pickup",
                targetEntityId: "item-1",
            };

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 0);
            assert.strictEqual(agent!.playerCommand, undefined);
        });

        it("returns empty array and clears command for interact", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "interact",
                targetEntityId: "door-1",
            };

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 0);
            assert.strictEqual(agent!.playerCommand, undefined);
        });
    });

    describe("onActionFailed", () => {
        const target = { x: 14, y: 9 };

        function orderedEntity() {
            const entity = createBehaviorTestEntity("worker", 10, 8);
            getBehaviorAgent(entity)!.playerCommand = {
                action: "move",
                targetPosition: target,
            };
            return entity;
        }

        it("keeps the order through a blockage a replan can route around", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = orderedEntity();

            behavior.onActionFailed!(entity, { type: "pathBlocked", target });

            assert.notStrictEqual(
                getBehaviorAgent(entity)!.playerCommand,
                undefined,
            );
        });

        it("drops the order on a failure nothing explains", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = orderedEntity();

            behavior.onActionFailed!(entity, { type: "unknown" });

            assert.strictEqual(
                getBehaviorAgent(entity)!.playerCommand,
                undefined,
            );
        });
    });
});
