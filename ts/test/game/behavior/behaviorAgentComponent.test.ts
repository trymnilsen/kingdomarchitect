import { describe, it } from "node:test";
import assert from "node:assert";
import {
    clearPlayerCommand,
    createBehaviorAgentComponent,
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { createTestEntity } from "./behaviorTestHelpers.ts";

describe("BehaviorAgentComponent", () => {
    describe("createBehaviorAgentComponent", () => {
        it("creates component with default values", () => {
            const component = createBehaviorAgentComponent();

            assert.strictEqual(component.id, "behavioragent");
            assert.strictEqual(component.currentBehaviorName, null);
            assert.strictEqual(component.actionQueue.length, 0);
            assert.strictEqual(component.hysteresis, null);
            assert.deepStrictEqual(component.pendingReplan, { kind: "replan" });
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
        it("sets pendingReplan on entity with agent", () => {
            const entity = createTestEntity();
            const agent = createBehaviorAgentComponent();
            entity.setEcsComponent(agent);

            requestReplan(entity);

            assert.deepStrictEqual(agent.pendingReplan, { kind: "replan" });
        });
    });

    describe("clearPlayerCommand", () => {
        it("consumes the command and invalidates the component", () => {
            const entity = createTestEntity();
            const agent = createBehaviorAgentComponent();
            entity.setEcsComponent(agent);
            agent.playerCommand = {
                action: "move",
                targetPosition: { x: 12, y: 8 },
            };

            let invalidated: string | null = null;
            entity.entityEvent = (event) => {
                if (event.id === "component_updated") {
                    invalidated = event.item.id;
                }
            };

            clearPlayerCommand(entity);

            assert.strictEqual(agent.playerCommand, undefined);
            assert.strictEqual(invalidated, "behavioragent");
        });
    });
});
