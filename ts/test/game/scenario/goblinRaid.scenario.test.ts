import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { createPhaseTransitionSystem } from "../../../src/game/system/phaseTransitionSystem.ts";
import { createInventorySpillSystem } from "../../../src/game/system/inventorySpillSystem.ts";
import { GameTime } from "../../../src/game/gameTime.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import {
    formGoblinRaid,
    initialRaidThreshold,
} from "../../../src/game/raid/goblinRaid.ts";
import { kingdomScore } from "../../../src/game/raid/kingdomScore.ts";
import {
    CAMP_SIZE_SCORE_DIVISOR,
    GOBLIN_HOUSE_CAP,
    RAID_THRESHOLD_GROWTH,
    WORKER_SCORE,
} from "../../../src/game/raid/raidConstants.ts";
import { createRaidBehavior } from "../../../src/game/behavior/behaviors/goblin/raidBehavior.ts";
import {
    RaidingComponentId,
    createRaidingComponent,
} from "../../../src/game/component/raidingComponent.ts";
import { GoblinUnitComponentId } from "../../../src/game/component/goblinUnitComponent.ts";
import { GoblinCampComponentId } from "../../../src/game/component/goblinCampComponent.ts";
import { goblinCampSystem } from "../../../src/game/system/goblinCampSystem.ts";
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
 * Build a goblin camp of 5 goblins and arm every raid gate: the camp prefab's
 * initial goblin plus four more, clustered around the camp. Defender identity is
 * not controlled here, so tests that care about it place goblins explicitly.
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
    armRaid(harness, camp);
    return { camp, goblins: [goblin, ...extra] };
}

/**
 * Grow the kingdom with workers until it is worth at least `target`. Workers are
 * the lever because they are the cheapest score to add and need no placement.
 *
 * Every setup that has to clear (or stay under) a raid threshold goes through
 * this rather than a hardcoded worker count, so retuning the threshold constants
 * cannot break tests that are not about tuning.
 */
function enrichKingdomTo(harness: ScenarioHarness, target: number): Entity[] {
    const deficit = target - kingdomScore(harness.root);
    if (deficit <= 0) {
        return [];
    }
    return harness.addPlayerUnits(Math.ceil(deficit / WORKER_SCORE));
}

/**
 * Satisfy every raid gate for a camp built directly in a test: mark it "full"
 * (maxPopulation = the goblins currently present) and make the kingdom rich
 * enough to clear whatever bar this camp will seed for itself. After this the
 * only remaining gate is whether valid targets exist.
 */
function armRaid(harness: ScenarioHarness, camp: Entity): void {
    const present = camp.children.filter(
        (c) =>
            c.hasComponent(GoblinUnitComponentId) &&
            !c.hasComponent(RaidingComponentId),
    ).length;
    camp.getEcsComponent(GoblinCampComponentId)!.maxPopulation = present;
    enrichKingdomTo(
        harness,
        initialRaidThreshold(harness.root, camp.worldPosition),
    );
}

/** The kingdom score as the raid system sees it. */
function scoreOf(harness: ScenarioHarness): number {
    return kingdomScore(harness.root);
}

/** The threshold a camp is currently waiting for. */
function thresholdOf(camp: Entity): number {
    return camp.getEcsComponent(GoblinCampComponentId)!.nextRaidThreshold;
}

/**
 * Top a camp back up to its maxPopulation with fresh goblins, so that a test
 * probing the prosperity gate is not silently blocked by the full-camp gate
 * instead. Positions are spread along a free row well clear of the camp.
 */
function refillCamp(harness: ScenarioHarness, camp: Entity): void {
    const maxPopulation = camp.getEcsComponent(
        GoblinCampComponentId,
    )!.maxPopulation;
    let offset = 0;
    while (
        camp.children.filter(
            (c) =>
                c.hasComponent(GoblinUnitComponentId) &&
                !c.hasComponent(RaidingComponentId),
        ).length < maxPopulation
    ) {
        harness.addGoblinToCamp(camp, { x: 9 + offset, y: 22 });
        offset++;
    }
}

/**
 * A full, above-floor camp of 5 goblins at the given position, with no workers
 * added, so a test probing the prosperity gate controls the kingdom score itself.
 */
function fullCampAt(harness: ScenarioHarness, campPos: Point): Entity {
    const { camp } = harness.addGoblinCamp(campPos);
    for (const p of [
        { x: campPos.x - 1, y: campPos.y },
        { x: campPos.x + 1, y: campPos.y },
        { x: campPos.x, y: campPos.y - 1 },
        { x: campPos.x - 1, y: campPos.y - 1 },
    ]) {
        harness.addGoblinToCamp(camp, p);
    }
    camp.getEcsComponent(GoblinCampComponentId)!.maxPopulation = 5;
    return camp;
}

/**
 * The shared starting point for the pacing tests: a full camp at (12,14) facing
 * a kingdom left exactly one worker short of the bar that camp will seed. A
 * single addPlayerUnits(1) is then what tips it over, whatever the constants are
 * currently tuned to.
 */
function poorKingdomWithFullCamp(): {
    harness: ScenarioHarness;
    kingdom: Entity;
    camp: Entity;
} {
    const harness = new ScenarioHarness();
    const kingdom = harness.addPlayerKingdom();
    harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 }, "stock");
    const camp = fullCampAt(harness, { x: 12, y: 14 });
    enrichKingdomTo(
        harness,
        initialRaidThreshold(harness.root, camp.worldPosition) - WORKER_SCORE,
    );
    return { harness, kingdom, camp };
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
        const { camp, goblin: initial } = harness.addGoblinCamp({
            x: 12,
            y: 14,
        });
        for (const p of [
            { x: 16, y: 14 },
            { x: 17, y: 14 },
            { x: 16, y: 16 },
            { x: 17, y: 16 },
        ]) {
            harness.addGoblinToCamp(camp, p);
        }

        armRaid(harness, camp);
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

        const { camp, goblin: initial } = harness.addGoblinCamp({
            x: 12,
            y: 14,
        });
        // Move the prefab goblin far away so it isn't the closest.
        initial.worldPosition = { x: 18, y: 14 };
        // Two goblins equidistant (d²=1) from the campfire at (12,14) → a tie.
        const tieA = harness.addGoblinToCamp(camp, { x: 13, y: 14 });
        const tieB = harness.addGoblinToCamp(camp, { x: 11, y: 14 });
        // Two more, clearly farther.
        harness.addGoblinToCamp(camp, { x: 16, y: 14 });
        harness.addGoblinToCamp(camp, { x: 17, y: 16 });

        armRaid(harness, camp);
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

    it("does not raid until the camp has filled its houses (full gate)", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        // A grown camp (maxPopulation 5) but only 2 goblins so far. Floor and
        // valve are satisfied (plenty of workers); the only thing holding the
        // raid back is that the camp has not filled its houses yet.
        const { camp } = harness.addGoblinCamp({ x: 12, y: 14 });
        harness.addGoblinToCamp(camp, { x: 11, y: 14 });
        camp.getEcsComponent(GoblinCampComponentId)!.maxPopulation = 5;
        harness.addPlayerUnits(10);

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "an under-strength camp does not raid",
        );
    });

    it("does not raid below the size floor", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        // Camp full at 2 goblins, but 2 < RAID_MIN_HOUSES (3): no raid even with
        // plenty of workers. This is the early-game grace window.
        const { camp } = harness.addGoblinCamp({ x: 12, y: 14 });
        harness.addGoblinToCamp(camp, { x: 11, y: 14 });
        camp.getEcsComponent(GoblinCampComponentId)!.maxPopulation = 2;
        harness.addPlayerUnits(10);

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "a camp below the size floor never raids",
        );
    });

    it("holds off a poor kingdom, then strikes once it prospers (gate)", () => {
        const { harness, camp } = poorKingdomWithFullCamp();

        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            0,
            "a kingdom not yet worth the walk is left alone",
        );
        assert.ok(
            thresholdOf(camp) > scoreOf(harness),
            "the camp is waiting on a bar it has already seeded",
        );

        // One more worker is all it takes to cross the bar.
        harness.addPlayerUnits(1);
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            4,
            "once the kingdom is rich enough, the camp raids",
        );
    });

    it("raises its bar above the kingdom it just raided", () => {
        const { harness, camp } = poorKingdomWithFullCamp();
        harness.addPlayerUnits(1);

        const scoreAtRaid = scoreOf(harness);
        formGoblinRaid(harness.root);
        assert.strictEqual(raidersOf(camp).length, 4, "the raid fires");
        assert.strictEqual(
            thresholdOf(camp),
            scoreAtRaid * RAID_THRESHOLD_GROWTH,
            "the bar is restamped above the score the kingdom had that night",
        );

        // Refill so the full-camp gate is not what blocks the next night.
        refillCamp(harness, camp);
        const raidersBefore = raidersOf(camp).length;
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            raidersBefore,
            "an unchanged kingdom is not raided again the following night",
        );
    });

    it("grants a repelled kingdom downtime until it grows past the new bar", () => {
        const { harness, kingdom, camp } = poorKingdomWithFullCamp();
        harness.addPlayerUnits(1);

        formGoblinRaid(harness.root);
        assert.strictEqual(raidersOf(camp).length, 4, "the first raid fires");
        refillCamp(harness, camp);

        // The raid was beaten off, so the kingdom kept everything it had. Growth
        // alone is the lever here: climb to one worker short of the new bar.
        enrichKingdomTo(harness, thresholdOf(camp) - WORKER_SCORE);
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            4,
            "just short of the new bar, so no second raid",
        );

        harness.addPlayerUnits(1);
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            8,
            "outgrowing the bar brings the camp back",
        );
    });

    it("leaves a razed kingdom alone until it rebuilds past the bar", () => {
        const { harness, kingdom, camp } = poorKingdomWithFullCamp();
        harness.addPlayerUnits(1);

        formGoblinRaid(harness.root);
        assert.strictEqual(raidersOf(camp).length, 4, "the first raid fires");
        refillCamp(harness, camp);

        // The raid landed: the stockpile is gone, so the score collapses while
        // the bar stands where it was stamped.
        harness.root.findEntity("stock")!.remove();
        assert.ok(
            scoreOf(harness) < thresholdOf(camp),
            "razing drops the kingdom back under the camp's bar",
        );
        for (let night = 0; night < 5; night++) {
            formGoblinRaid(harness.root);
            assert.strictEqual(
                raidersOf(camp).length,
                4,
                "a razed kingdom is given time to rebuild",
            );
        }

        // Rebuild the stockpile and grow back past the bar.
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 }, "s2");
        enrichKingdomTo(harness, thresholdOf(camp));
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(camp).length,
            8,
            "once rebuilt past the bar the camp marches again",
        );
    });

    it("seeds distant camps with a higher bar than near ones", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "stock",
        );

        const near = fullCampAt(harness, { x: 12, y: 14 });
        const far = fullCampAt(harness, { x: 28, y: 22 });
        const nearBar = initialRaidThreshold(harness.root, near.worldPosition);
        const farBar = initialRaidThreshold(harness.root, far.worldPosition);
        assert.ok(nearBar < farBar, "the formula favours the nearer camp");

        // Under both bars: both camps seed themselves and neither marches.
        enrichKingdomTo(harness, nearBar - WORKER_SCORE);
        formGoblinRaid(harness.root);
        assert.strictEqual(raidersOf(near).length, 0, "the near camp waits");
        assert.strictEqual(raidersOf(far).length, 0, "the far camp waits");
        assert.strictEqual(
            thresholdOf(near),
            nearBar,
            "the near camp seeded the bar the formula predicts",
        );
        assert.strictEqual(thresholdOf(far), farBar, "and so did the far one");

        // Grow to sit between the two bars.
        enrichKingdomTo(harness, nearBar);
        assert.ok(
            scoreOf(harness) < farBar,
            "the kingdom is worth the near camp's walk but not the far one's",
        );
        formGoblinRaid(harness.root);
        assert.strictEqual(
            raidersOf(near).length,
            4,
            "the near camp marches first",
        );
        assert.strictEqual(
            raidersOf(far).length,
            0,
            "the far camp needs a richer prize",
        );
    });

    it("seeds and raids on the same night when the kingdom is already rich", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(
            kingdom,
            stockPile,
            { x: 20, y: 14 },
            "stock",
        );
        const { camp } = fullCamp(harness, { x: 12, y: 14 });

        assert.strictEqual(
            thresholdOf(camp),
            0,
            "a fresh camp has not been seeded yet",
        );

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            4,
            "seeding must not cost the camp its night",
        );
    });

    it("excludes goblins already out raiding from the trigger", () => {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 20, y: 14 });

        const { camp } = harness.addGoblinCamp({ x: 12, y: 14 });
        for (const p of [
            { x: 11, y: 14 },
            { x: 13, y: 14 },
            { x: 12, y: 13 },
            { x: 12, y: 15 },
        ]) {
            harness.addGoblinToCamp(camp, p);
        }
        camp.getEcsComponent(GoblinCampComponentId)!.maxPopulation = 5;
        harness.addPlayerUnits(10);

        // Four goblins are already committed to a raid. Only one remains
        // present, so the camp is no longer "full" and must not deploy again.
        for (const g of goblinsOf(camp).slice(0, 4)) {
            g.setEcsComponent(createRaidingComponent("target"));
        }

        formGoblinRaid(harness.root);

        assert.strictEqual(
            raidersOf(camp).length,
            4,
            "the four already-raiding goblins are unchanged; none added",
        );
    });

    it("camp size tracks kingdom prosperity, caps, and never shrinks", () => {
        const harness = new ScenarioHarness([goblinCampSystem]);
        const { camp } = harness.addGoblinCamp({ x: 12, y: 14 });
        const campComp = camp.getEcsComponent(GoblinCampComponentId)!;

        // Worth exactly six goblins, whatever the constants are tuned to.
        enrichKingdomTo(harness, 6 * CAMP_SIZE_SCORE_DIVISOR);
        harness.tick();
        assert.strictEqual(
            campComp.maxPopulation,
            6,
            "tracks the score divided by the size divisor",
        );

        // Rich enough to want more goblins than the hard ceiling allows.
        const big = enrichKingdomTo(
            harness,
            (GOBLIN_HOUSE_CAP + 6) * CAMP_SIZE_SCORE_DIVISOR,
        );
        harness.tick();
        assert.strictEqual(
            campComp.maxPopulation,
            GOBLIN_HOUSE_CAP,
            "capped at the house cap",
        );

        // Remove the surplus so the computed target falls back to 6.
        for (const u of big) harness.root.removeChild(u);
        harness.tick();
        assert.strictEqual(
            campComp.maxPopulation,
            GOBLIN_HOUSE_CAP,
            "camp does not shrink when the kingdom declines",
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
        harness.tickUntil((root) => root.findEntity("target") === null, 150);

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
            harness.addPlayerBuilding(
                kingdom,
                stoneWall,
                p,
                `wall-${p.x}-${p.y}`,
            );
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
        assert.ok(
            hp(harness.root.findEntity("B")!) < 100,
            "B is taking damage",
        );
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

    it("razing a stockpile spills its contents onto the ground", () => {
        const harness = new ScenarioHarness([
            pathfindingSystem,
            createInventorySpillSystem(new GameTime()),
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
            "the stockpile itself is gone",
        );

        // The wood survives the raid on the ground: losing the building should
        // cost the player the hauling, not the resources.
        let wood = 0;
        for (const [entity, collectable] of harness.root.queryComponents(
            CollectableComponentId,
        )) {
            if (!entity.hasComponent(GroundItemComponentId)) continue;
            for (const stack of collectable.items) {
                if (stack.item.id === woodResourceItem.id) {
                    wood += stack.amount;
                }
            }
        }
        assert.strictEqual(wood, 25, "all 25 wood is lying in the yard");
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
