import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createBehaviorAgentComponent,
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/behavior/components/BehaviorAgentComponent.ts";
import { createTestEntity } from "./behaviorTestHelpers.ts";

describe("BehaviorAgentComponent", () => {
    describe("createBehaviorAgentComponent", () => {
        it("creates component with default values", () => {
            const component = createBehaviorAgentComponent();

            assert.strictEqual(component.id, "behavioragent");
            assert.strictEqual(component.currentBehaviorName, null);
            assert.strictEqual(component.actionQueue.length, 0);
            assert.strictEqual(component.shouldReplan, false);
            assert.strictEqual(component.playerCommand, undefined);
        });
    });

    describe("getBehaviorAgent", () => {
        it("returns agent component when present", () => {
            const entity = createTestEntity();
            const agent = createBehaviorAgentComponent();
            entity.setEcsComponent(agent);

            const retrieved = getBehaviorAgent(entity);

            assert.strictEqual(retrieved, agent);
        });

        it("returns null when agent component not present", () => {
            const entity = createTestEntity();

            const retrieved = getBehaviorAgent(entity);

            assert.strictEqual(retrieved, null);
        });
    });

    describe("requestReplan", () => {
        it("sets shouldReplan to true on entity with agent", () => {
            const entity = createTestEntity();
            const agent = createBehaviorAgentComponent();
            entity.setEcsComponent(agent);

            requestReplan(entity);

            assert.strictEqual(agent.shouldReplan, true);
        });

        it("does nothing on entity without agent", () => {
            const entity = createTestEntity();

            requestReplan(entity);
        });
    });

    describe("playerCommand", () => {
        it("can set move command", () => {
            const agent = createBehaviorAgentComponent();
            agent.playerCommand = {
                action: "move",
                targetPosition: { x: 10, y: 10 },
            };

            assert.strictEqual(agent.playerCommand.action, "move");
            assert.deepStrictEqual(agent.playerCommand.targetPosition, {
                x: 10,
                y: 10,
            });
        });

        it("can set attack command", () => {
            const agent = createBehaviorAgentComponent();
            agent.playerCommand = {
                action: "attack",
                targetEntityId: "enemy-1",
            };

            assert.strictEqual(agent.playerCommand.action, "attack");
            assert.strictEqual(
                agent.playerCommand.targetEntityId,
                "enemy-1",
            );
        });

        it("can set pickup command", () => {
            const agent = createBehaviorAgentComponent();
            agent.playerCommand = {
                action: "pickup",
                targetEntityId: "item-1",
            };

            assert.strictEqual(agent.playerCommand.action, "pickup");
            assert.strictEqual(agent.playerCommand.targetEntityId, "item-1");
        });

        it("can set interact command", () => {
            const agent = createBehaviorAgentComponent();
            agent.playerCommand = {
                action: "interact",
                targetEntityId: "door-1",
            };

            assert.strictEqual(agent.playerCommand.action, "interact");
            assert.strictEqual(
                agent.playerCommand.targetEntityId,
                "door-1",
            );
        });
    });
});
