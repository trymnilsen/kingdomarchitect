import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { executeMoveToAction } from "../../../src/game/behavior/actions/moveToAction.ts";
import type { MoveToActionData } from "../../../src/game/behavior/actions/moveToAction.ts";
import { farm } from "../../../src/data/building/grow/grow.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { pointEquals, type Point } from "../../../src/common/point.ts";

/**
 * Regression guard for the farm-traversal bug: the A* planner and the per-tile
 * step check in executeMoveToAction must agree on what "walkable" means. A farm
 * carries a sub-threshold TraversalComponent, so it is passable-but-heavy — the
 * planner routes through it. The step check previously rejected ANY building
 * outright, so the worker failed the moment it tried to step onto the planned
 * farm tile (plan → fail → replan forever).
 *
 * This drives executeMoveToAction directly because both gates live inside it.
 * The unit test on isImpassableStructure can't catch a regression here: it stays
 * green if someone re-inlines a divergent building check into the mover.
 */

/**
 * Seal column x with impassable walls except for a single gap row, so the only
 * way from one side to the other is the tile at (x, gapY). Stockpiles carry no
 * TraversalComponent, so they are walls per isImpassableStructure; placing them
 * through the real prefab gives them the SpriteComponent the spatial index
 * requires (entities without one are invisible to queryEntity).
 */
function sealColumnExcept(
    harness: ScenarioHarness,
    columnX: number,
    gapY: number,
    yStart: number,
    yEnd: number,
): void {
    for (let y = yStart; y <= yEnd; y++) {
        if (y === gapY) continue;
        harness.placeBuilding(`wall_${columnX}_${y}`, { x: columnX, y }, {
            building: stockPile,
        });
    }
}

describe("move-through-farm scenario tests", () => {
    it("walks a worker through a farm tile instead of failing on it", () => {
        const harness = new ScenarioHarness();

        // Wall the full tile-height column at x=20, leaving only y=15 open,
        // and place the farm in that gap. The world edges (no tiles past the
        // chunked area) close off the wall ends, so the farm is the sole
        // crossing between the worker and its target.
        const gap: Point = { x: 20, y: 15 };
        sealColumnExcept(harness, 20, gap.y, 8, 23);
        harness.placeBuilding("farm", gap, { building: farm });

        const worker = harness.addWorker("worker", { x: 16, y: 15 });
        const target: Point = { x: 24, y: 15 };

        const action: MoveToActionData = { type: "moveTo", target };

        let steppedOnFarm = false;
        let failed = false;
        let arrived = false;

        for (let tick = 1; tick <= 40; tick++) {
            const result = executeMoveToAction(action, worker, tick);
            if (pointEquals(worker.worldPosition, gap)) {
                steppedOnFarm = true;
            }
            if (result.kind === "failed") {
                failed = true;
                break;
            }
            if (result.kind === "complete") {
                arrived = true;
                break;
            }
        }

        assert.strictEqual(
            failed,
            false,
            "move must not fail on the passable farm tile",
        );
        assert.ok(
            steppedOnFarm,
            "worker should have stepped onto the farm tile en route (the only crossing)",
        );
        assert.ok(arrived, "worker should reach the target on the far side");
        assert.ok(
            pointEquals(worker.worldPosition, target),
            "worker should end on the target tile",
        );
    });
});
