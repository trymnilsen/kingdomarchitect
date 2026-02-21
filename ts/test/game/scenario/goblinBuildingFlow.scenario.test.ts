import assert from "node:assert";
import { describe, it } from "node:test";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/BehaviorSystem.ts";
import { createBehaviorResolver } from "../../../src/game/behavior/behaviorResolver.ts";
import { warmthSystem } from "../../../src/game/system/warmthSystem.ts";
import { goblinCampSystem } from "../../../src/game/system/goblinCampSystem.ts";
import { createKeepWarmBehavior } from "../../../src/game/behavior/behaviors/goblin/keepWarmBehavior.ts";
import { createGoblinCampComponent } from "../../../src/game/component/goblinCampComponent.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import { createGoblinUnitComponent } from "../../../src/game/component/goblinUnitComponent.ts";
import {
    createWarmthComponent,
    COLD_THRESHOLD,
    WarmthComponentId,
} from "../../../src/game/component/warmthComponent.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { BuildingComponentId } from "../../../src/game/component/buildingComponent.ts";
import { FireSourceComponentId } from "../../../src/game/component/fireSourceComponent.ts";
import { goblinCampfire } from "../../../src/data/building/goblin/goblinCampfire.ts";
import { goblinHut } from "../../../src/data/building/goblin/goblinHut.ts";
import { HousingComponentId } from "../../../src/game/component/housingComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../src/game/map/path/graph/generateGraph.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { isPointAdjacentTo } from "../../../src/common/point.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { TileChunk } from "../../../src/game/map/chunk.ts";
import type { Point } from "../../../src/common/point.ts";

function createWorld(bounds: { min: Point; max: Point }): {
    ecsWorld: EcsWorld;
    root: Entity;
} {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    for (
        let cx = Math.floor(bounds.min.x / 8) - 1;
        cx <= Math.floor(bounds.max.x / 8) + 1;
        cx++
    ) {
        for (
            let cy = Math.floor(bounds.min.y / 8) - 1;
            cy <= Math.floor(bounds.max.y / 8) + 1;
            cy++
        ) {
            const chunk: TileChunk = { chunkX: cx, chunkY: cy };
            setChunk(tileComponent, chunk);
        }
    }
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );

    return { ecsWorld, root };
}

function createCamp(root: Entity, id: string, position: Point): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent(5));
    camp.setEcsComponent(createJobQueueComponent());
    root.addChild(camp);
    camp.worldPosition = position;
    return camp;
}

function createGoblin(camp: Entity, position: Point): Entity {
    const goblin = new Entity("goblin1");
    goblin.setEcsComponent(createGoblinUnitComponent(camp.id));
    goblin.setEcsComponent(createWarmthComponent(COLD_THRESHOLD - 1, 1.0));
    goblin.setEcsComponent(createBehaviorAgentComponent());
    goblin.setEcsComponent(createInventoryComponent());
    goblin.setEcsComponent(createHealthComponent(10, 10));
    camp.addChild(goblin);
    goblin.worldPosition = position;
    return goblin;
}

function createTree(root: Entity, id: string, position: Point): Entity {
    const tree = new Entity(id);
    tree.setEcsComponent(createResourceComponent("tree1"));
    // Low HP so it dies in one chop (10 damage per tick), yielding 10 wood immediately
    tree.setEcsComponent(createHealthComponent(10, 10));
    root.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

function runSystems(
    root: Entity,
    ticks: number,
    behaviorSystem = createBehaviorSystem(() => [createKeepWarmBehavior()]),
): void {
    for (let tick = 1; tick <= ticks; tick++) {
        behaviorSystem.onUpdate!(root, tick);
        goblinCampSystem.onUpdate!(root, tick);
        warmthSystem.onUpdate!(root, tick);
    }
}

function findBuiltCampfire(camp: Entity): Entity | null {
    for (const child of camp.children) {
        const building = child.getEcsComponent(BuildingComponentId);
        if (
            building?.building.id === goblinCampfire.id &&
            !building.scaffolded
        ) {
            return child;
        }
    }
    return null;
}

describe("Goblin Building Flow", () => {
    it("cold goblin builds campfire and warms up when tree is adjacent", () => {
        /**
         * Scenario: No movement needed to reach the tree.
         * Goblin and camp are at (12, 8). Tree is immediately adjacent at (13, 8).
         * Full flow: harvest → deposit → construct → warm at fire.
         */
        const { root } = createWorld({
            min: { x: 4, y: 2 },
            max: { x: 20, y: 16 },
        });

        const camp = createCamp(root, "goblinCamp1", { x: 12, y: 8 });
        const goblin = createGoblin(camp, { x: 12, y: 8 });
        createTree(root, "tree1", { x: 13, y: 8 });

        runSystems(root, 80);

        const campfire = findBuiltCampfire(camp);
        assert.ok(campfire, "Campfire should be fully constructed");
        assert.ok(
            campfire.getEcsComponent(FireSourceComponentId),
            "Completed campfire should have a FireSourceComponent",
        );

        const warmth = goblin.getEcsComponent(WarmthComponentId)!;
        assert.ok(
            warmth.warmth >= COLD_THRESHOLD,
            `Goblin should be warm after building campfire (warmth: ${warmth.warmth})`,
        );
        const dx = Math.abs(goblin.worldPosition.x - campfire.worldPosition.x);
        const dy = Math.abs(goblin.worldPosition.y - campfire.worldPosition.y);
        assert.ok(
            Math.max(dx, dy) <= 1,
            `Goblin should be within 1 tile of fire (goblin: ${JSON.stringify(goblin.worldPosition)}, fire: ${JSON.stringify(campfire.worldPosition)})`,
        );
    });

    it("cold goblin travels to distant tree, builds campfire, and warms up", () => {
        /**
         * Scenario: Tree is 7 tiles from camp. Goblin must travel there to harvest.
         * Verifies mid-simulation movement before asserting full completion.
         */
        const { root } = createWorld({
            min: { x: 4, y: 2 },
            max: { x: 24, y: 16 },
        });

        const camp = createCamp(root, "goblinCamp1", { x: 12, y: 8 });
        const goblin = createGoblin(camp, { x: 12, y: 8 });
        createTree(root, "tree1", { x: 19, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [createKeepWarmBehavior()]);

        // Run enough ticks for goblin to begin moving toward the tree but not yet finish
        for (let tick = 1; tick <= 8; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            warmthSystem.onUpdate!(root, tick);
        }

        assert.ok(
            goblin.worldPosition.x > 12,
            `Goblin should have moved east toward the tree (x: ${goblin.worldPosition.x})`,
        );

        // Run to full completion
        for (let tick = 9; tick <= 120; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            warmthSystem.onUpdate!(root, tick);
        }

        const campfire = findBuiltCampfire(camp);
        assert.ok(
            campfire,
            "Campfire should be fully constructed after traveling to gather wood",
        );
        assert.ok(
            campfire.getEcsComponent(FireSourceComponentId),
            "Completed campfire should have a FireSourceComponent",
        );

        const warmth = goblin.getEcsComponent(WarmthComponentId)!;
        assert.ok(
            warmth.warmth >= COLD_THRESHOLD,
            `Goblin should be warm after completing the full build flow (warmth: ${warmth.warmth})`,
        );
        assert.ok(
            isPointAdjacentTo(goblin.worldPosition, campfire.worldPosition),
            `Goblin should be adjacent to fire, not on top of it (goblin: ${JSON.stringify(goblin.worldPosition)}, fire: ${JSON.stringify(campfire.worldPosition)})`,
        );
    });

    it("goblin builds campfire then hut once warm", () => {
        /**
         * Scenario: Goblin starts cold with no fire and no hut in camp.
         * Three trees are placed adjacent to camp (campfire needs 10 wood, hut needs 15).
         * Full flow: keepWarm triggers → harvest → deposit → build campfire → warm up →
         *            expandCamp triggers → harvest more → deposit → build hut.
         */
        const { root } = createWorld({
            min: { x: 4, y: 2 },
            max: { x: 24, y: 16 },
        });

        const camp = createCamp(root, "goblinCamp1", { x: 12, y: 8 });
        createGoblin(camp, { x: 12, y: 8 });
        // Three trees: campfire costs 10 wood (1 tree), hut costs 15 wood (2 trees)
        createTree(root, "tree1", { x: 13, y: 8 });
        createTree(root, "tree2", { x: 14, y: 8 });
        createTree(root, "tree3", { x: 15, y: 8 });

        const behaviorSystem = createBehaviorSystem(createBehaviorResolver());

        runSystems(root, 400, behaviorSystem);

        const campfire = findBuiltCampfire(camp);
        assert.ok(campfire, "Campfire should be fully constructed first");

        const hut = camp.children.find((child) => {
            const b = child.getEcsComponent(BuildingComponentId);
            return b?.building.id === goblinHut.id && !b.scaffolded;
        });
        assert.ok(hut, "Goblin hut should be fully constructed");
        assert.ok(
            hut!.getEcsComponent(HousingComponentId),
            "Completed hut should have a HousingComponent",
        );

    });

    it("cold goblin moves to existing fire and warms up without building", () => {
        /**
         * Scenario: A completed campfire already exists in camp.
         * Goblin starts 4 tiles away and must move to warm up.
         * No scaffold should ever be placed since the fire already exists.
         */
        const { root } = createWorld({
            min: { x: 4, y: 2 },
            max: { x: 22, y: 16 },
        });

        const camp = createCamp(root, "goblinCamp1", { x: 12, y: 8 });
        const goblin = createGoblin(camp, { x: 16, y: 8 });

        const fire = buildingPrefab(goblinCampfire, false);
        camp.addChild(fire);
        fire.worldPosition = { x: 13, y: 8 };

        runSystems(root, 40);

        const warmth = goblin.getEcsComponent(WarmthComponentId)!;
        assert.ok(
            warmth.warmth >= COLD_THRESHOLD,
            `Goblin should warm up at the existing fire (warmth: ${warmth.warmth})`,
        );

        const campfireScaffolds = camp.children.filter((child) => {
            const b = child.getEcsComponent(BuildingComponentId);
            return b?.scaffolded && b.building.id === goblinCampfire.id;
        });
        assert.strictEqual(
            campfireScaffolds.length,
            0,
            "keepWarm should not place a campfire scaffold when a campfire already exists",
        );
    });
});
