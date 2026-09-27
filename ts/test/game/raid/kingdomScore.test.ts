import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "../scenario/scenarioHarness.ts";
import { kingdomScore } from "../../../src/game/raid/kingdomScore.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { stoneWall } from "../../../src/data/building/stone/wall.ts";
import { road } from "../../../src/data/building/gold/road.ts";

describe("kingdomScore", () => {
    it("ignores buildings that are still scaffolded", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 22, y: 14 },
            "under-construction",
            true,
        );

        assert.strictEqual(
            kingdomScore(harness.root),
            100,
            "a half-built frame is not yet wealth",
        );
    });

    it("scores fortification at nothing", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });
        const walled = kingdomScore(harness.root);

        for (let offset = 0; offset < 6; offset++) {
            harness.addPlayerBuilding(
                kingdom,
                stoneWall,
                { x: 18 + offset, y: 12 },
                `wall-${offset}`,
            );
        }

        assert.strictEqual(
            kingdomScore(harness.root),
            walled,
            "walling in does not raise the threat level",
        );
    });

    it("scores roads at nothing", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();

        for (let offset = 0; offset < 8; offset++) {
            harness.addPlayerBuilding(
                kingdom,
                road,
                { x: 14 + offset, y: 16 },
                `road-${offset}`,
            );
        }

        assert.strictEqual(
            kingdomScore(harness.root),
            0,
            "paving is infrastructure, not wealth",
        );
    });

    it("ignores buildings that are not owned by the player kingdom", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });
        // The camp prefab brings a campfire, and camps build stockpiles of their
        // own. None of it is the player's, so none of it is the player's wealth.
        harness.addGoblinCamp({ x: 12, y: 14 });
        harness.placeBuilding("unowned", { x: 24, y: 20 });

        assert.strictEqual(kingdomScore(harness.root), 100);
    });
});
