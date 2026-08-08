import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "../scenario/scenarioHarness.ts";
import { kingdomScore } from "../../../src/game/raid/kingdomScore.ts";
import { WORKER_SCORE } from "../../../src/game/raid/raidConstants.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { woodenHouse } from "../../../src/data/building/wood/house.ts";
import { stoneWall } from "../../../src/data/building/stone/wall.ts";
import { road } from "../../../src/data/building/stone/road.ts";
import { torch } from "../../../src/data/building/light/torch.ts";

describe("kingdomScore", () => {
    it("counts each player worker at WORKER_SCORE", () => {
        const harness = new ScenarioHarness();
        harness.addPlayerUnits(3);

        assert.strictEqual(kingdomScore(harness.root), 3 * WORKER_SCORE);
    });

    it("sums the raid value of player buildings", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });
        harness.addPlayerBuilding(kingdom, woodenHouse, { x: 22, y: 14 });

        assert.strictEqual(kingdomScore(harness.root), 160, "100 + 60");
    });

    it("falls back to the default value for a building with no raid value", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        // torch declares no raidValue, so it is worth a generic building.
        harness.addPlayerBuilding(kingdom, torch, { x: 20, y: 14 });

        assert.strictEqual(kingdomScore(harness.root), 20);
    });

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

    it("scores the kingdom the camp size divisor was calibrated against", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerUnits(6);
        for (let house = 0; house < 3; house++) {
            harness.addPlayerBuilding(
                kingdom,
                woodenHouse,
                { x: 18 + house * 2, y: 18 },
                `house-${house}`,
            );
        }
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        assert.strictEqual(
            kingdomScore(harness.root),
            400,
            "6 workers (120) + 3 houses (180) + a stockpile (100)",
        );
    });
});
