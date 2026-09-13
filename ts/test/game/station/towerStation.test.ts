import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { stoneTower } from "../../../src/data/building/stone/tower.ts";
import { WorkerRole } from "../../../src/game/component/worker/roleComponent.ts";
import {
    ROLE_RANK_STEP,
    TOP_ROLE_UTILITY,
} from "../../../src/game/component/worker/rolePriority.ts";
import { setRoles } from "../behavior/behaviorTestHelpers.ts";
import { createPlayerUnitComponent } from "../../../src/game/component/playerUnitComponent.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../../src/game/component/stationComponent.ts";
import {
    isManningStation,
    isTowerManned,
    stationOccupant,
    stationUnderEntity,
} from "../../../src/game/component/stationQuery.ts";
import { createGarrisonBehavior } from "../../../src/game/behavior/behaviors/garrisonBehavior.ts";
import {
    executeHoldStationAction,
    type HoldStationActionData,
} from "../../../src/game/behavior/actions/holdStationAction.ts";
import { getGameTimeTick } from "../../../src/game/component/gameTimeComponent.ts";
import { createStepOutsideBehavior } from "../../../src/game/behavior/behaviors/stepOutsideBehavior.ts";
import {
    searchlightWedgeOffsets,
    SWEEP_ORDER,
} from "../../../src/game/vision/searchlight.ts";
import type { Point } from "../../../src/common/point.ts";
import { STATION_MANNED_REACH } from "../../../src/game/vision/visionReach.ts";

function addTower(
    root: Entity,
    id: string,
    pos: Point,
    priority: StationPriority,
): Entity {
    const tower = buildingPrefab(stoneTower, false, id);
    root.addChild(tower);
    tower.worldPosition = pos;
    tower.getEcsComponent(StationComponentId)!.priority = priority;
    return tower;
}

function addUnit(
    root: Entity,
    id: string,
    pos: Point,
    role: WorkerRole = WorkerRole.Guard,
): Entity {
    const unit = new Entity(id);
    setRoles(unit, [role]);
    unit.setEcsComponent(createPlayerUnitComponent());
    root.addChild(unit);
    unit.worldPosition = pos;
    return unit;
}

describe("searchlight wedge geometry", () => {
    const R = STATION_MANNED_REACH;

    it("the four cardinal wedges partition the reach-diamond exactly", () => {
        // Every non-centre tile of the Manhattan diamond must land in exactly one
        // quarter, with no gaps and no overlap.
        const seen = new Map<string, number>();
        for (const aim of SWEEP_ORDER) {
            for (const o of searchlightWedgeOffsets(aim, R)) {
                const key = `${o.x},${o.y}`;
                seen.set(key, (seen.get(key) ?? 0) + 1);
            }
        }
        let diamondTiles = 0;
        for (let dx = -R; dx <= R; dx++) {
            for (let dy = -R; dy <= R; dy++) {
                if (Math.abs(dx) + Math.abs(dy) > R) continue;
                if (dx === 0 && dy === 0) continue; // centre excluded
                diamondTiles++;
                const count = seen.get(`${dx},${dy}`) ?? 0;
                assert.strictEqual(
                    count,
                    1,
                    `tile (${dx},${dy}) covered ${count}× (want exactly 1)`,
                );
            }
        }
        assert.strictEqual(
            seen.size,
            diamondTiles,
            "wedges cover only diamond tiles",
        );
    });

    it("wedge tiles stay within the diamond and exclude the centre", () => {
        for (const aim of SWEEP_ORDER) {
            for (const o of searchlightWedgeOffsets(aim, R)) {
                assert.ok(Math.abs(o.x) + Math.abs(o.y) <= R, "within diamond");
                assert.ok(!(o.x === 0 && o.y === 0), "centre excluded");
            }
        }
    });
});

describe("station occupancy queries", () => {
    it("a guard on an enabled tower is manning it", () => {
        const { root } = createMinimalWorld();
        const tower = addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        assert.strictEqual(stationUnderEntity(guard), tower);
        assert.strictEqual(stationOccupant(root, tower), guard);
        assert.strictEqual(isTowerManned(root, tower), true);
        assert.strictEqual(isManningStation(guard), true);
    });

    it("a disabled (Off) tower is not being manned", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.Off);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        // Role-agnostic occupancy still sees the body...
        assert.notStrictEqual(stationUnderEntity(guard), null);
        // ...but the role+enabled exemption does not apply, so it will be grounded.
        assert.strictEqual(isManningStation(guard), false);
    });

    it("a non-guard on a tower is not manning it", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const worker = addUnit(root, "w", { x: 2, y: 2 }, WorkerRole.Worker);

        assert.strictEqual(isManningStation(worker), false);
    });

    it("a guard standing off the tower is not manning anything", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 5, y: 5 });

        assert.strictEqual(stationUnderEntity(guard), null);
        assert.strictEqual(isManningStation(guard), false);
    });
});

describe("garrison behavior", () => {
    const garrison = createGarrisonBehavior();

    it("walks an idle guard to an enabled tower", () => {
        const { root } = createMinimalWorld();
        const tower = addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 5, y: 5 });

        assert.strictEqual(garrison.isValid(guard), true);
        const actions = garrison.expand(guard);
        assert.deepStrictEqual(actions[0], {
            type: "moveTo",
            target: tower.worldPosition,
            goal: { kind: "adjacent" },
        });
        assert.deepStrictEqual(actions[1], {
            type: "stepOnto",
            targetId: tower.id,
        });
    });

    it("holds the post once the guard is already manning it", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        assert.strictEqual(garrison.isValid(guard), true);

        const plan = garrison.expand(guard);
        assert.strictEqual(plan.length, 1);
        const hold = plan[0] as HoldStationActionData;
        assert.strictEqual(hold.type, "holdStation");
        assert.ok(
            hold.untilTick > getGameTimeTick(root),
            "the watch ends at a fixed future tick rather than counting down",
        );
    });

    it("keeps standing until the watch is up, then ends it", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        const hold = garrison.expand(guard)[0] as HoldStationActionData;
        const before = { ...hold };

        assert.deepStrictEqual(
            executeHoldStationAction(hold, guard, hold.untilTick - 1),
            { kind: "running" },
        );
        assert.deepStrictEqual(
            hold,
            before,
            "a running watch rewrites nothing, so it puts no delta on the wire",
        );
        assert.deepStrictEqual(
            executeHoldStationAction(hold, guard, hold.untilTick),
            { kind: "complete" },
        );
    });

    it("gives up the watch when the station is switched off underneath it", () => {
        const { root } = createMinimalWorld();
        const tower = addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        const hold = garrison.expand(guard)[0] as HoldStationActionData;
        tower.requireEcsComponent(StationComponentId).priority =
            StationPriority.Off;

        const result = executeHoldStationAction(
            hold,
            guard,
            hold.untilTick - 1,
        );

        assert.strictEqual(
            result.kind,
            "failed",
            "the guard is handed back to selection instead of waiting out the tick",
        );
    });

    it("gives up the watch when the guard is no longer on the tower", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        const hold = garrison.expand(guard)[0] as HoldStationActionData;
        guard.worldPosition = { x: 5, y: 5 };

        const result = executeHoldStationAction(
            hold,
            guard,
            hold.untilTick - 1,
        );

        assert.strictEqual(result.kind, "failed");
    });

    it("is not valid for a guard whose Guard role is excluded", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 5, y: 5 });
        setRoles(guard, [WorkerRole.Worker]);

        assert.strictEqual(garrison.isValid(guard), false);
    });

    it("leaves a manning guard when the Guard role is taken away", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });
        setRoles(guard, [WorkerRole.Worker]);

        assert.strictEqual(garrison.isValid(guard), false);
        assert.strictEqual(
            isManningStation(guard),
            false,
            "so StepOutside grounds it rather than leaving it on the roof",
        );
    });

    it("scores holding the post by the rank the player gave it", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        setRoles(guard, [WorkerRole.Guard, WorkerRole.Worker]);
        const above = garrison.utility(guard);

        setRoles(guard, [WorkerRole.Worker, WorkerRole.Guard]);
        const below = garrison.utility(guard);

        assert.strictEqual(above, TOP_ROLE_UTILITY);
        assert.strictEqual(below, TOP_ROLE_UTILITY - ROLE_RANK_STEP);
        assert.ok(
            above > below,
            "a guard ranked above work outscores it, and below work loses to it",
        );
    });

    it("does nothing when the only tower is disabled", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.Off);
        const guard = addUnit(root, "g", { x: 5, y: 5 });

        assert.strictEqual(garrison.isValid(guard), false);
    });

    it("a second guard does not target a tower already occupied", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        addUnit(root, "a", { x: 2, y: 2 }); // guard A manning it
        const guardB = addUnit(root, "b", { x: 6, y: 6 });

        assert.strictEqual(garrison.isValid(guardB), false);
    });

    it("a second guard covers a different free tower", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t1", { x: 2, y: 2 }, StationPriority.High);
        const t2 = addTower(root, "t2", { x: 8, y: 8 }, StationPriority.High);
        addUnit(root, "a", { x: 2, y: 2 }); // A on t1
        const guardB = addUnit(root, "b", { x: 7, y: 7 });

        assert.strictEqual(garrison.isValid(guardB), true);
        const actions = garrison.expand(guardB);
        assert.deepStrictEqual(actions[1], {
            type: "stepOnto",
            targetId: t2.id,
        });
    });
});

describe("step-outside exemption (anti-oscillation)", () => {
    const stepOutside = createStepOutsideBehavior();

    function mannedWorld(priority: StationPriority, role: WorkerRole) {
        const { root, world } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, priority);
        const unit = addUnit(root, "g", { x: 2, y: 2 }, role);
        world.runUpdate(1); // index the chunk map for queryEntity
        return { root, unit };
    }

    it("does NOT ground a guard manning an enabled tower", () => {
        const { unit } = mannedWorld(StationPriority.High, WorkerRole.Guard);
        assert.strictEqual(stepOutside.isValid(unit), false);
    });

    it("grounds a guard left on a disabled tower", () => {
        const { unit } = mannedWorld(StationPriority.Off, WorkerRole.Guard);
        assert.strictEqual(stepOutside.isValid(unit), true);
    });

    it("grounds a non-guard left on a tower", () => {
        const { unit } = mannedWorld(StationPriority.High, WorkerRole.Worker);
        assert.strictEqual(stepOutside.isValid(unit), true);
    });
});
