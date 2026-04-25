import { describe, it } from "node:test";
import assert from "node:assert";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createPerformPlayerCommandBehavior } from "../../../src/game/behavior/behaviors/PerformPlayerCommandBehavior.ts";
import {
    createBehaviorTestEntity,
    createTestEntity,
} from "./behaviorTestHelpers.ts";
import { getBehaviorAgent } from "../../../src/game/component/BehaviorAgentComponent.ts";

function createAttackScene(): { root: Entity; attacker: Entity; target: Entity } {
    const root = new Entity("root");
    const attacker = createBehaviorTestEntity("attacker", 10, 8);
    const target = new Entity("target");
    target.worldPosition = { x: 15, y: 12 };
    root.addChild(attacker);
    root.addChild(target);
    return { root, attacker, target };
}

describe("PerformPlayerCommandBehavior", () => {
    describe("isValid", () => {
        it("returns true when entity has player command", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "move",
                targetPosition: { x: 10, y: 10 },
            };

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns false when entity has no player command", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns false when entity has no behavior agent", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createTestEntity();

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns 90 for player commands", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "move",
                targetPosition: { x: 10, y: 10 },
            };

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 90);
        });
    });

    describe("expand", () => {
        it("expands move command to moveTo + clearPlayerCommand actions", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();
            const agent = getBehaviorAgent(entity);
            agent!.playerCommand = {
                action: "move",
                targetPosition: { x: 5, y: 7 },
            };

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            if (actions[0].type === "moveTo") {
                assert.deepStrictEqual(actions[0].target, { x: 5, y: 7 });
            }
            assert.strictEqual(actions[1].type, "clearPlayerCommand");
        });

        it("expands attack command to moveTo + attackTarget + clearPlayerCommand", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const { attacker, target } = createAttackScene();
            const agent = getBehaviorAgent(attacker);
            agent!.playerCommand = {
                action: "attack",
                targetEntityId: target.id,
            };

            const actions = behavior.expand(attacker);

            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            if (actions[0].type === "moveTo") {
                assert.deepStrictEqual(actions[0].target, { x: 15, y: 12 });
                assert.strictEqual(actions[0].stopAdjacent, "cardinal");
            }
            assert.strictEqual(actions[1].type, "attackTarget");
            if (actions[1].type === "attackTarget") {
                assert.strictEqual(actions[1].targetId, target.id);
            }
            assert.strictEqual(actions[2].type, "clearPlayerCommand");
        });

        it("clears attack command and returns empty array when target not found", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const { attacker } = createAttackScene();
            const agent = getBehaviorAgent(attacker);
            agent!.playerCommand = {
                action: "attack",
                targetEntityId: "nonexistent",
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

        it("returns empty array when no player command", () => {
            const behavior = createPerformPlayerCommandBehavior();
            const entity = createBehaviorTestEntity();

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 0);
        });
    });

    describe("name", () => {
        it("has name 'performPlayerCommand'", () => {
            const behavior = createPerformPlayerCommandBehavior();

            assert.strictEqual(behavior.name, "performPlayerCommand");
        });
    });
});
