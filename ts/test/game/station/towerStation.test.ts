import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { stoneTower } from "../../../src/data/building/stone/tower.ts";
import {
    createRoleComponent,
    RoleComponentId,
    WorkerRole,
} from "../../../src/game/component/worker/roleComponent.ts";
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
import { createGarrisonBehavior } from "../../../src/game/behavior/behaviors/GarrisonBehavior.ts";
import { createStepOutsideBehavior } from "../../../src/game/behavior/behaviors/StepOutsideBehavior.ts";
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
    const roleComponent = createRoleComponent();
    roleComponent.role = role;
    unit.setEcsComponent(roleComponent);
    unit.setEcsComponent(createPlayerUnitComponent());
    root.addChild(unit);
    unit.worldPosition = pos;
    return unit;
}

describe("searchlight wedge geometry", () => {
    const R = STATION_MANNED_REACH;

    it("the four cardinal wedges partition the reach-diamond exactly", () => {
        // Every non-centre tile of the Manhattan diamond must land in exactly one
        // quarter — no gaps, no overlap.
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

    it("a disabled (Off) tower is not being manned — self-heals", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.Off);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        // Role-agnostic occupancy still sees the body...
        assert.notStrictEqual(stationUnderEntity(guard), null);
        // ...but the role+enabled exemption does not apply, so it will be grounded.
        assert.strictEqual(isManningStation(guard), false);
    });

    it("a non-guard on a tower is not manning it — self-heals", () => {
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
            stopAdjacent: "cardinal",
        });
        assert.deepStrictEqual(actions[1], {
            type: "stepOnto",
            targetId: tower.id,
        });
    });

    it("is idle (invalid) once the guard is already manning the post", () => {
        const { root } = createMinimalWorld();
        addTower(root, "t", { x: 2, y: 2 }, StationPriority.High);
        const guard = addUnit(root, "g", { x: 2, y: 2 });

        assert.strictEqual(garrison.isValid(guard), false);
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
