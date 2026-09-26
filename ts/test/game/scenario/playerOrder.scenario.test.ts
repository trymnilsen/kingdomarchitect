import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../src/common/point.ts";
import {
    getBehaviorAgent,
    requestReplan,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { wallOff } from "../testWorld.ts";
import { ScenarioHarness } from "./scenarioHarness.ts";

describe("player order scenario", () => {
    it("drops a move order to a tile nobody can reach and frees the worker", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 14, y: 20 });
        const enclosed: Point = { x: 26, y: 20 };
        wallOff(harness.root, {
            x1: enclosed.x,
            y1: enclosed.y,
            x2: enclosed.x,
            y2: enclosed.y,
        });
        const agent = getBehaviorAgent(worker)!;

        agent.playerCommand = { action: "move", targetPosition: enclosed };
        requestReplan(worker);
        const ticks = harness.tickUntil(
            () => agent.playerCommand === undefined,
            40,
        );

        assert.strictEqual(
            agent.playerCommand,
            undefined,
            `still ordered after ${ticks} ticks`,
        );
        harness.tick();
        assert.notStrictEqual(
            agent.currentBehaviorName,
            "performPlayerCommand",
            "the worker should be back to its own business",
        );
    });
});
