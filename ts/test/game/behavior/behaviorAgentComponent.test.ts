import { describe, it } from "node:test";
import assert from "node:assert";
import {
    clearPlayerCommand,
    createBehaviorAgentComponent,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { createTestEntity } from "./behaviorTestHelpers.ts";

describe("BehaviorAgentComponent", () => {
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
