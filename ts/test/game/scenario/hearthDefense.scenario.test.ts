import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { pathfindingSystem } from "../../../src/game/system/pathfindingSystem.ts";
import { watchSystem } from "../../../src/game/system/watchSystem.ts";
import {
    HEARTH_DEFENSE_INTERVAL,
    hearthDefenseSystem,
} from "../../../src/game/system/hearthDefenseSystem.ts";
import { cresset } from "../../../src/data/building/light/cresset.ts";
import { stoneTower } from "../../../src/data/building/stone/tower.ts";
import { goblinPrefab } from "../../../src/game/prefab/goblinPrefab.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import {
    RoleComponentId,
    WorkerRole,
    WorkerStance,
    createRoleComponent,
} from "../../../src/game/component/worker/roleComponent.ts";
import { createPlayerUnitComponent } from "../../../src/game/component/playerUnitComponent.ts";
import {
    getTopThreat,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";
import { BehaviorAgentComponentId } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { LightSourceComponentId } from "../../../src/game/component/lightSourceComponent.ts";
import { WatchComponentId } from "../../../src/game/component/watchComponent.ts";
import {
    computeHearthlight,
    isInHearthlight,
} from "../../../src/game/light/hearthlight.ts";
import {
    hasDiscoveredTile,
    WorldDiscoveryComponentId,
} from "../../../src/game/component/worldDiscoveryComponent.ts";
import { searchlightWedgeOffsets } from "../../../src/game/vision/searchlight.ts";
import { STATION_MANNED_REACH } from "../../../src/game/vision/visionReach.ts";
import {
    createDayComponent,
    DayComponentId,
} from "../../../src/game/component/dayComponent.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../../src/game/component/stationComponent.ts";

/**
 * Builds a harness mirroring the production order that matters here: hearth
 * defense before behavior (same-tick replans), watch after (its wedge from
 * tick N feeds the scan at N+).
 */
function makeHarness(): { harness: ScenarioHarness; kingdom: Entity } {
    const harness = new ScenarioHarness(
        [pathfindingSystem, watchSystem],
        [hearthDefenseSystem],
    );
    const kingdom = harness.addPlayerKingdom();
    // One deliberate light: a cresset pool at (12,8) plus cardinals.
    harness.addPlayerBuilding(kingdom, cresset, { x: 12, y: 8 }, "cresset1");
    return { harness, kingdom };
}

function makeAggressive(worker: Entity): void {
    worker.getEcsComponent(RoleComponentId)!.stance = WorkerStance.Aggressive;
}

function addGoblin(harness: ScenarioHarness, position: Point): Entity {
    const goblin = goblinPrefab("no-camp");
    harness.root.addChild(goblin);
    goblin.worldPosition = position;
    return goblin;
}

/** A bare watchman body: guard role plus player unit, no behavior agent. */
function addWatchman(harness: ScenarioHarness, position: Point): Entity {
    const unit = new Entity("watchman");
    const role = createRoleComponent();
    role.role = WorkerRole.Guard;
    unit.setEcsComponent(role);
    unit.setEcsComponent(createPlayerUnitComponent());
    harness.root.addChild(unit);
    unit.worldPosition = position;
    return unit;
}

function behaviorName(entity: Entity): string | null {
    return (
        entity.getEcsComponent(BehaviorAgentComponentId)?.currentBehaviorName ??
        null
    );
}

describe("hearth defense", () => {
    it("writes intrusion entries only for aggressive defenders inside hearthlight", () => {
        const { harness } = makeHarness();
        const aggressive = harness.addWorker("aggro", { x: 13, y: 8 });
        makeAggressive(aggressive);
        const defensive = harness.addWorker("passive", { x: 11, y: 8 });
        const aggressiveInDark = harness.addWorker("dark", { x: 20, y: 16 });
        makeAggressive(aggressiveInDark);
        const goblin = addGoblin(harness, { x: 12, y: 9 });

        harness.tickN(HEARTH_DEFENSE_INTERVAL);

        const aggressiveThreat =
            aggressive.getEcsComponent(ThreatMapComponentId)!;
        assert.strictEqual(
            aggressiveThreat.threat[goblin.id]?.source,
            "intrusion",
            "aggressive worker in the pool is rallied",
        );
        const defensiveThreat =
            defensive.getEcsComponent(ThreatMapComponentId)!;
        assert.deepStrictEqual(
            Object.keys(defensiveThreat.threat),
            [],
            "defensive worker gets no intrusion entry",
        );
        // The worker's own presence glow claims nothing, so standing alone in
        // the dark never counts as being inside hearthlight.
        const darkThreat =
            aggressiveInDark.getEcsComponent(ThreatMapComponentId)!;
        assert.deepStrictEqual(Object.keys(darkThreat.threat), []);
    });

    it("writes nothing when no intruder stands in the light", () => {
        const { harness } = makeHarness();
        const aggressive = harness.addWorker("aggro", { x: 13, y: 8 });
        makeAggressive(aggressive);
        // A goblin outside every pool is invisible to the scan.
        addGoblin(harness, { x: 24, y: 20 });

        harness.tickN(HEARTH_DEFENSE_INTERVAL);

        const threat = aggressive.getEcsComponent(ThreatMapComponentId)!;
        assert.deepStrictEqual(Object.keys(threat.threat), []);
    });

    it("engages within the interval and releases after the entry decays", () => {
        const { harness } = makeHarness();
        const worker = harness.addWorker("aggro", { x: 13, y: 8 });
        makeAggressive(worker);
        const goblin = addGoblin(harness, { x: 12, y: 9 });

        harness.tickN(HEARTH_DEFENSE_INTERVAL);
        assert.strictEqual(
            behaviorName(worker),
            "engageInCombat",
            "worker engages on the first defense scan",
        );

        // The goblin escapes into the dark: refreshes stop, the entry decays
        // out, and the worker disengages once its current move resolves.
        goblin.worldPosition = { x: 28, y: 20 };
        harness.tickN(12);
        const threat = worker.getEcsComponent(ThreatMapComponentId)!;
        assert.strictEqual(
            getTopThreat(threat, harness.currentTick, harness.root),
            undefined,
            "intrusion entry has decayed out",
        );
        const released = harness.tickUntil(
            () => behaviorName(worker) !== "engageInCombat",
            30,
        );
        assert.ok(released < 30, "worker replans away from the chase");
    });
});

describe("searchlight", () => {
    it("manning creates the wedge emitter and unmanning removes it", () => {
        const { harness, kingdom } = makeHarness();
        const tower = harness.addPlayerBuilding(
            kingdom,
            stoneTower,
            { x: 20, y: 12 },
            "tower1",
        );
        tower.getEcsComponent(StationComponentId)!.priority =
            StationPriority.High;
        const watchman = addWatchman(harness, { x: 20, y: 12 });

        harness.tick();
        const light = tower.getEcsComponent(LightSourceComponentId);
        assert.ok(light, "manned tower carries a light emitter");
        const aim = tower.getEcsComponent(WatchComponentId)!.beamAim;
        assert.deepStrictEqual(
            light!.pattern,
            searchlightWedgeOffsets(aim, STATION_MANNED_REACH),
            "pattern is the current wedge",
        );

        watchman.remove();
        harness.tick();
        const restored = tower.getEcsComponent(LightSourceComponentId);
        assert.strictEqual(
            restored?.sourceId,
            "buildingGlow",
            "unmanning restores the tower's own self-glow",
        );
        assert.strictEqual(
            restored?.pattern,
            null,
            "the wedge pattern is gone with the watchman",
        );
    });

    it("claims hearthlight at noon and trips defense on a goblin in the beam", () => {
        const { harness, kingdom } = makeHarness();
        const day = createDayComponent();
        day.phase = "day";
        harness.root.setEcsComponent(day);
        assert.strictEqual(
            harness.root.getEcsComponent(DayComponentId)?.phase,
            "day",
        );

        const tower = harness.addPlayerBuilding(
            kingdom,
            stoneTower,
            { x: 20, y: 12 },
            "tower1",
        );
        tower.getEcsComponent(StationComponentId)!.priority =
            StationPriority.High;
        addWatchman(harness, { x: 20, y: 12 });
        const worker = harness.addWorker("aggro", { x: 13, y: 8 });
        makeAggressive(worker);
        // In the initial N wedge of the tower: straight up, within reach.
        const goblin = addGoblin(harness, { x: 20, y: 9 });

        harness.tick();
        const hearth = computeHearthlight(harness.root);
        assert.strictEqual(
            isInHearthlight(hearth, { x: 20, y: 9 }),
            true,
            "the beam claims its wedge in full daylight",
        );

        harness.tickN(HEARTH_DEFENSE_INTERVAL);
        const threat = worker.getEcsComponent(ThreatMapComponentId)!;
        assert.strictEqual(
            threat.threat[goblin.id]?.source,
            "intrusion",
            "the beam is a tripwire feeding the defense scan",
        );
    });

    it("stamps swept tiles into the discovered store on aim advance", () => {
        const { harness, kingdom } = makeHarness();
        const tower = harness.addPlayerBuilding(
            kingdom,
            stoneTower,
            { x: 20, y: 12 },
            "tower1",
        );
        tower.getEcsComponent(StationComponentId)!.priority =
            StationPriority.High;
        addWatchman(harness, { x: 20, y: 12 });

        const discovery = harness.root.getEcsComponent(
            WorldDiscoveryComponentId,
        )!;

        harness.tick();
        assert.strictEqual(
            hasDiscoveredTile(discovery, "player", { x: 20, y: 9 }),
            true,
            "manning discovers the initial wedge",
        );
        assert.strictEqual(
            hasDiscoveredTile(discovery, "player", { x: 24, y: 12 }),
            false,
            "the east wedge is not discovered yet",
        );

        // The sweep advances to E at tick 10 and stamps what it now lights.
        harness.tickN(10);
        assert.strictEqual(
            hasDiscoveredTile(discovery, "player", { x: 24, y: 12 }),
            true,
            "aim advance discovers the freshly swept wedge",
        );
    });
});
