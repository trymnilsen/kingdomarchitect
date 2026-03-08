import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import {
    createPathfindingGraphComponent,
} from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../src/game/map/path/graph/generateGraph.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    getInventoryItem,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    StockpileComponentId,
} from "../../../src/game/component/stockpileComponent.ts";
import type { PreferredAmount } from "../../../src/game/component/stockpileComponent.ts";
import { setPreferredAmount } from "../../../src/game/component/stockpileComponent.ts";
import {
    createJobQueueComponent,
    addJob,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createEffectEmitterComponent,
} from "../../../src/game/component/effectEmitterComponent.ts";
import {
    createWorldDiscoveryComponent,
} from "../../../src/game/component/worldDiscoveryComponent.ts";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/BehaviorSystem.ts";
import { createBehaviorResolver } from "../../../src/game/behavior/behaviorResolver.ts";
import type { Jobs } from "../../../src/game/job/job.ts";
import type { Building } from "../../../src/data/building/building.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import type { EcsSystem } from "../../../src/common/ecs/ecsSystem.ts";
import type { Point } from "../../../src/common/point.ts";
import type { InventoryItemQuantity } from "../../../src/data/inventory/inventoryItemQuantity.ts";
import {
    createHousingComponent,
} from "../../../src/game/component/housingComponent.ts";
import {
    createFireSourceComponent,
} from "../../../src/game/component/fireSourceComponent.ts";

/**
 * Full-stack scenario test harness for logistics, crafting, and behavior flows.
 * Creates a world with tiles, pathfinding, job queue, and runs a real system
 * pipeline so tests exercise actual behavior selection and action execution.
 *
 * Pass extraSystems to add additional systems (e.g. effectSystem) to the pipeline.
 * Systems run in registration order: chunkMap → behavior → extraSystems.
 */
export class ScenarioHarness {
    root: Entity;
    ecsWorld: EcsWorld;
    currentTick: number = 0;

    constructor(extraSystems: EcsSystem[] = []) {
        this.ecsWorld = new EcsWorld();
        this.ecsWorld.addSystem(chunkMapSystem);
        this.root = this.ecsWorld.root;

        // Set up tiles covering a reasonable play area (x=8..31, y=8..23)
        const tileComponent = createTileComponent();
        for (let cx = 1; cx <= 4; cx++) {
            for (let cy = 1; cy <= 3; cy++) {
                setChunk(tileComponent, { chunkX: cx, chunkY: cy });
            }
        }
        this.root.setEcsComponent(tileComponent);
        this.root.setEcsComponent(createChunkMapComponent());
        this.root.setEcsComponent(
            createPathfindingGraphComponent(
                createLazyGraphFromRootNode(this.root),
            ),
        );

        this.root.setEcsComponent(createJobQueueComponent());
        // Required by discoverAfterMovement when entities have VisibilityComponent
        this.root.setEcsComponent(createEffectEmitterComponent(() => {}));
        this.root.setEcsComponent(createWorldDiscoveryComponent());

        this.ecsWorld.addSystem(createBehaviorSystem(createBehaviorResolver()));

        for (const system of extraSystems) {
            this.ecsWorld.addSystem(system);
        }

        this.ecsWorld.runInit();
    }

    /** Advance simulation by one tick */
    tick(): void {
        this.currentTick++;
        this.ecsWorld.runUpdate(this.currentTick);
    }

    /** Advance simulation by N ticks */
    tickN(n: number): void {
        for (let i = 0; i < n; i++) {
            this.tick();
        }
    }

    /**
     * Tick until predicate returns true or maxTicks is reached.
     * Returns the number of ticks elapsed. Does NOT throw if maxTicks is reached —
     * let the calling test assert on the return value or world state.
     */
    tickUntil(
        predicate: (root: Entity, tick: number) => boolean,
        maxTicks: number = 100,
    ): number {
        let elapsed = 0;
        while (!predicate(this.root, this.currentTick)) {
            if (elapsed >= maxTicks) {
                return elapsed;
            }
            this.tick();
            elapsed++;
        }
        return elapsed;
    }

    /** Add a worker entity using the real workerPrefab */
    addWorker(id: string, position: Point): Entity {
        const worker = workerPrefab(id);
        this.root.addChild(worker);
        worker.worldPosition = position;
        return worker;
    }

    /** Add a stockpile entity using the real buildingPrefab */
    addStockpile(
        id: string,
        position: Point,
        preferredAmounts: PreferredAmount[] = [],
    ): Entity {
        const stockpile = buildingPrefab(stockPile, false, id);
        if (preferredAmounts.length > 0) {
            const stockpileComp = stockpile.getEcsComponent(StockpileComponentId)!;
            for (const { itemId, amount } of preferredAmounts) {
                setPreferredAmount(stockpileComp, itemId, amount);
            }
        }
        this.root.addChild(stockpile);
        stockpile.worldPosition = position;
        return stockpile;
    }

    /** Add a crafting building entity using the real buildingPrefab */
    addCraftingBuilding(
        id: string,
        position: Point,
        building: Building,
    ): Entity {
        const entity = buildingPrefab(building, false, id);
        this.root.addChild(entity);
        entity.worldPosition = position;
        return entity;
    }

    /**
     * Add a building entity. Pass `{ housing: true }` to also add a HousingComponent,
     * and `{ tenant: entity }` to assign a tenant.
     */
    placeBuilding(
        id: string,
        position: Point,
        options?: { housing?: boolean; tenant?: Entity; building?: Building },
    ): Entity {
        const buildingDef = options?.building ?? stockPile;
        const entity = buildingPrefab(buildingDef, false, id);
        this.root.addChild(entity);
        entity.worldPosition = position;
        if (options?.housing) {
            entity.setEcsComponent(createHousingComponent(options.tenant ?? null));
        }
        return entity;
    }

    /**
     * Add a campfire entity at the given position.
     */
    placeCampfire(id: string, position: Point): Entity {
        const entity = new Entity(id);
        entity.setEcsComponent(createFireSourceComponent());
        this.root.addChild(entity);
        entity.worldPosition = position;
        return entity;
    }

    /** Queue a job on the global job queue */
    queueJob(job: Jobs): void {
        const queue = this.root.requireEcsComponent("JobQueue");
        addJob(queue, job);
    }

    /** Get all inventory items of an entity */
    getInventory(entity: Entity): InventoryItemQuantity[] {
        const inventory = entity.getEcsComponent(InventoryComponentId);
        return inventory?.items ?? [];
    }

    /** Get item count for a specific item in an entity's inventory */
    getItemCount(entity: Entity, itemId: string): number {
        const inventory = entity.getEcsComponent(InventoryComponentId);
        if (!inventory) return 0;
        return getInventoryItem(inventory, itemId)?.amount ?? 0;
    }
}
