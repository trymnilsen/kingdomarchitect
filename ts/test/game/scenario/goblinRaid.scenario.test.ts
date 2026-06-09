import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { createPhaseTransitionSystem } from "../../../src/game/system/phaseTransitionSystem.ts";
import { stockpileDestructionSystem } from "../../../src/game/system/stockpileDestructionSystem.ts";
import { formGoblinRaid } from "../../../src/game/raid/goblinRaid.ts";
import { createRaidBehavior } from "../../../src/game/behavior/behaviors/goblin/raidBehavior.ts";
import { RaidingComponentId } from "../../../src/game/component/raidingComponent.ts";
import { GoblinUnitComponentId } from "../../../src/game/component/goblinUnitComponent.ts";
import {
    BehaviorAgentComponentId,
    requestReplan,
} from "../../../src/game/component/BehaviorAgentComponent.ts";
import {
    addThreat,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";
import {
    WarmthComponentId,
    COLD_THRESHOLD,
} from "../../../src/game/component/warmthComponent.ts";
import { HealthComponentId } from "../../../src/game/component/healthComponent.ts";
import { DayComponentId } from "../../../src/game/component/dayComponent.ts";
import {
    InventoryComponentId,
    addInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { woodenHouse } from "../../../src/data/building/wood/house.ts";
import { stoneWall } from "../../../src/data/building/stone/wall.ts";
import { torch } from "../../../src/data/building/light/torch.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";

// --- small query helpers (no entity construction; all creation goes through
// the real prefabs via ScenarioHarness) ---

function goblinsOf(camp: Entity): Entity[] {
    return camp.children.filter((c) => c.hasComponent(GoblinUnitComponentId));
}

function raidersOf(camp: Entity): Entity[] {
    return goblinsOf(camp).filter((g) => g.hasComponent(RaidingComponentId));
}

function defenderOf(camp: Entity): Entity | undefined {
    return goblinsOf(camp).find((g) => !g.hasComponent(RaidingComponentId));
}

function behaviorName(entity: Entity): string | null {
    return (
        entity.getEcsComponent(BehaviorAgentComponentId)?.currentBehaviorName ??
        null
    );
}

function hp(entity: Entity): number {
    return entity.getEcsComponent(HealthComponentId)?.currentHp ?? 0;
}

function targetIdOf(raider: Entity): string {
    return raider.getEcsComponent(RaidingComponentId)!.targetId;
}

function setWarmth(goblin: Entity, value: number): void {
    const warmth = goblin.getEcsComponent(WarmthComponentId)!;
    warmth.warmth = value;
    goblin.invalidateComponent(WarmthComponentId);
}

/**
 * Build a goblin camp at full population (maxPopulation = 5): the camp prefab's
 * initial goblin plus four more, clustered around the camp. Defender identity is
 * not controlled here — tests that care about it place goblins explicitly.
 */
function fullCamp(
    harness: ScenarioHarness,
    campPos: Point,
): { camp: Entity; goblins: Entity[] } {
    const { camp, goblin } = harness.addGoblinCamp(campPos);
    const extra = [
        { x: campPos.x - 1, y: campPos.y },
        { x: campPos.x + 1, y: campPos.y + 1 },
        { x: campPos.x - 1, y: campPos.y + 1 },
        { x: campPos.x + 1, y: campPos.y - 1 },
    ].map((p) => harness.addGoblinToCamp(camp, p));
    return { camp, goblins: [goblin, ...extra] };
}

describe("goblin night raid scenario tests", () => {
    // --- Formation (drive only formGoblinRaid, no ticking) ---

    it("forms a raid sending all goblins but one", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        // Camp at (12,14): campfire at (12,14), initial goblin at (13,14) [d²=1].
        // Extra goblins placed clearly farther so the initial one is uniquely
        // closest to the fire and is therefore the defender.
        const { camp, goblin: initial } = harness.addGoblinCamp({ x: 12, y: 14 });
        for (const p of [
            { x: 16, y: 14 },
            { x: 17, y: 14 },
            { x: 16, y: 16 },
            { x: 17, y: 16 },
        ]) {
            harness.addGoblinToCamp(camp, p);
        }

        formGoblinRaid(harness.root);

        assert.strictEqual(raidersOf(camp).length, 4, "4 of 5 goblins raid");
        assert.strictEqual(
            defenderOf(camp)?.id,
            initial.id,
            "the goblin closest to the campfire stays as defender",
        );
        assert.ok(
            !initial.hasComponent(RaidingComponentId),
            "defender has no RaidingComponent",
        );
    });

    it("picks the lowest-id goblin as defender on a distance tie", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        const { camp, goblin: initial } = harness.addGoblinCamp({ x: 12, y: 14 });
        // Move the prefab goblin far away so it isn't the closest.
        initial.worldPosition = { x: 18, y: 14 };
        // Two goblins equidistant (d²=1) from the campfire at (12,14) → a tie.
        const tieA = harness.addGoblinToCamp(camp, { x: 13, y: 14 });
        const tieB = harness.addGoblinToCamp(camp, { x: 11, y: 14 });
        // Two more, clearly farther.
        harness.addGoblinToCamp(camp, { x: 16, y: 14 });
        harness.addGoblinToCamp(camp, { x: 17, y: 16 });

        formGoblinRaid(harness.root);

        const expectedDefender = [tieA, tieB].sort((a, b) =>
            a.id < b.id ? -1 : 1,
        )[0];
        const other = expectedDefender === tieA ? tieB : tieA;
        assert.strictEqual(
            defenderOf(camp)?.id,
            expectedDefender.id,
            "lower-id goblin among the tied-nearest is the defender",
        );
        assert.ok(
            other.hasComponent(RaidingComponentId),
            "the other tied goblin raids",
        );
    });

    it("does not raid below max population", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        // maxPopulation is 5; only 2 goblins present.
        const { camp } = harness.addGoblinCamp({ x: 12, y: 14 });
        harness.addGoblinToCamp(camp, { x: 11, y: 14 });

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "an under-strength camp does not raid",
        );
    });

    it("does not raid when there are no valid player buildings", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        // A wall has raidValue 0 → never a raid objective.
        harness.addPlayerBuilding(kingdom, stoneWall, { x: 20, y: 14 });

        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "no raiders are stamped when only zero-value buildings exist",
        );
    });

    it("prioritises high-value buildings and spreads ~2 per target", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        const stock = harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "stockpile",
        );
        const house = harness.addPlayerBuilding(
            kingdom,
            woodenHouse,
            { x: 20, y: 18 },
            "house",
        );

        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);

        const raiders = raidersOf(camp);
        assert.strictEqual(raiders.length, 4, "4 raiders");
        const ids = raiders.map(targetIdOf);
        assert.strictEqual(
            ids.filter((id) => id === stock.id).length,
            2,
            "2 raiders target the high-value stockpile",
        );
        assert.strictEqual(
            ids.filter((id) => id === house.id).length,
            2,
            "2 raiders target the house",
        );
    });

    // --- Siege & destruction (drive the behavior system) ---

    it("razes an undefended building in the open", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "target",
        );
        fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        harness.tickUntil(
            (root) => root.findEntity("target") === null,
            150,
        );

        assert.strictEqual(
            harness.root.findEntity("target"),
            null,
            "the building is razed",
        );
    });

    it("breaks through a wall to reach a walled-in target", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        // Torch target fully ringed by 8 stone walls — the only way in is to
        // break a wall. Raiders approach from the west, so they breach (19,14).
        harness.addPlayerBuilding(kingdom, torch, { x: 20, y: 14 }, "target");
        const ring: Point[] = [
            { x: 19, y: 13 },
            { x: 19, y: 14 },
            { x: 19, y: 15 },
            { x: 20, y: 13 },
            { x: 20, y: 15 },
            { x: 21, y: 13 },
            { x: 21, y: 14 },
            { x: 21, y: 15 },
        ];
        for (const p of ring) {
            harness.addPlayerBuilding(kingdom, stoneWall, p, `wall-${p.x}-${p.y}`);
        }
        fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        harness.tickUntil((root) => root.findEntity("target") === null, 300);

        assert.strictEqual(
            harness.root.findEntity("target"),
            null,
            "the walled-in target is razed",
        );
        assert.strictEqual(
            harness.root.findEntity("wall-19-14"),
            null,
            "the western wall on the route was breached",
        );
        assert.ok(
            harness.root.findEntity("wall-21-14") !== null,
            "the far wall was not needlessly destroyed (minimal breach)",
        );
    });

    it("goes around a wall instead of breaching when the detour is short", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, torch, { x: 20, y: 14 }, "target");
        // A single wall directly between camp and target, but the target's other
        // neighbours are open, so a short detour is cheaper than breaching.
        const wall = harness.addPlayerBuilding(
            kingdom,
            stoneWall,
            { x: 19, y: 14 },
            "wall",
        );
        fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        harness.tickUntil((root) => root.findEntity("target") === null, 200);

        assert.strictEqual(
            harness.root.findEntity("target"),
            null,
            "the target is razed",
        );
        assert.ok(
            harness.root.findEntity("wall") !== null,
            "the wall was not destroyed",
        );
        assert.strictEqual(hp(wall), 100, "the wall is untouched (detoured)");
    });

    // --- Behavior priority & edges ---

    it("ignores warmth while raiding", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        // Target far to the east; the campfire is back west at the camp.
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 24, y: 14 },
            "target",
        );
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        const raider = raidersOf(camp)[0];
        setWarmth(raider, 10); // below COLD_THRESHOLD (50)
        requestReplan(raider);
        const startX = raider.worldPosition.x;

        harness.tickN(8);

        assert.strictEqual(
            behaviorName(raider),
            "raid",
            "a cold raider keeps raiding rather than keeping warm",
        );
        assert.ok(
            raider.worldPosition.x > startX,
            `raider moved east toward the target, not back to the fire (startX ${startX}, now ${raider.worldPosition.x})`,
        );
    });

    it("leaves the defender free to keep warm", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "target",
        );
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        const defender = defenderOf(camp)!;
        setWarmth(defender, 10);
        requestReplan(defender);

        harness.tick();

        assert.strictEqual(
            behaviorName(defender),
            "keepWarm",
            "the un-stamped defender still keeps warm when cold",
        );
        assert.strictEqual(
            behaviorName(raidersOf(camp)[0]),
            "raid",
            "raiders raid",
        );
    });

    it("defends itself when attacked, then resumes the raid", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "target",
        );
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        const raider = raidersOf(camp)[0];

        // A worker attacks the raider: register threat against it.
        const attacker = harness.addWorker("attacker", {
            x: raider.worldPosition.x + 1,
            y: raider.worldPosition.y,
        });
        addThreat(
            raider.getEcsComponent(ThreatMapComponentId)!,
            attacker.id,
            5,
            harness.currentTick,
        );
        requestReplan(raider);
        harness.tick();

        assert.strictEqual(
            behaviorName(raider),
            "engageInCombat",
            "raider defends itself (engageInCombat outranks raid)",
        );

        // Threat gone → resume raiding.
        attacker.remove();
        requestReplan(raider);
        harness.tick();

        assert.strictEqual(
            behaviorName(raider),
            "raid",
            "raider resumes the raid once the threat is gone",
        );
    });

    it("re-targets when its building is destroyed", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 }, "A");
        harness.addPlayerBuilding(kingdom, woodenHouse, { x: 20, y: 18 }, "B");
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        const raiderA = raidersOf(camp).find((r) => targetIdOf(r) === "A");
        assert.ok(raiderA, "a raider was assigned to building A");

        harness.root.findEntity("A")!.remove();
        harness.tickUntil((root) => hp(root.findEntity("B")!) < 100, 200);

        assert.strictEqual(
            targetIdOf(raiderA!),
            "B",
            "the raider re-targeted the remaining building",
        );
        assert.ok(hp(harness.root.findEntity("B")!) < 100, "B is taking damage");
    });

    it("stops raiding when no buildings remain", () => {
        const harness = new ScenarioHarness([pathfindingSystem]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 }, "only");
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        const raider = raidersOf(camp)[0];

        harness.tickUntil((root) => root.findEntity("only") === null, 200);
        assert.strictEqual(
            harness.root.findEntity("only"),
            null,
            "the only building is razed",
        );

        const raidBehavior = createRaidBehavior();
        assert.ok(
            !raidBehavior.isValid(raider),
            "raid behavior is invalid once no targets remain",
        );

        harness.tickN(3); // must not crash
        assert.notStrictEqual(
            behaviorName(raider),
            "raid",
            "the raider yields to idle in the ruins",
        );
    });

    // --- Integration with adjacent systems ---

    it("razing a stockpile removes it and its stored contents", () => {
        const harness = new ScenarioHarness([
            pathfindingSystem,
            stockpileDestructionSystem,
        ]);
        const kingdom = harness.addPlayerKingdom();
        const store = harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "store",
        );
        addInventoryItem(
            store.getEcsComponent(InventoryComponentId)!,
            woodResourceItem,
            25,
        );
        fullCamp(harness, { x: 12, y: 14 });

        formGoblinRaid(harness.root);
        harness.tickUntil((root) => root.findEntity("store") === null, 150);

        assert.strictEqual(
            harness.root.findEntity("store"),
            null,
            "the stockpile (and its inventory) is gone",
        );
    });

    it("forms the raid when the night phase begins", () => {
        const harness = new ScenarioHarness([
            pathfindingSystem,
            createPhaseTransitionSystem(),
        ]);
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "target",
        );
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        // During the day, no raid has formed yet.
        harness.tickN(100);
        assert.strictEqual(
            harness.root.getEcsComponent(DayComponentId)?.phase,
            "day",
            "still daytime at tick 100",
        );
        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "no raid forms before night",
        );

        // Tick into the night (night begins at tick 180).
        harness.tickUntil(
            (root) => root.getEcsComponent(DayComponentId)?.phase === "night",
            150,
        );
        assert.ok(
            raidersOf(camp).length > 0,
            "the night phase transition triggered the raid",
        );
    });
});
