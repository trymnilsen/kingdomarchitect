import { EcsWorld } from "../../../src/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import { makeWorldGenSystem } from "../../../src/game/system/worldGenerationSystem.ts";
import {
    createTileComponent,
    setChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import type { BiomeType } from "../../../src/game/map/biome.ts";
import type { NaturalResource } from "../../../src/data/inventory/items/naturalResource.ts";
import { resourcePrefab } from "../../../src/game/prefab/resourcePrefab.ts";
import { addGroundCovering, testVolume } from "../testWorld.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../src/game/map/path/graph/generateGraph.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    getInventoryItem,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { HeldItemComponentId } from "../../../src/game/component/heldItemComponent.ts";
import { StockpileComponentId } from "../../../src/game/component/stockpileComponent.ts";
import type { PreferredAmount } from "../../../src/game/component/stockpileComponent.ts";
import { setPreferredAmount } from "../../../src/game/component/stockpileComponent.ts";
import {
    createJobQueueComponent,
    addJob,
} from "../../../src/game/component/jobQueueComponent.ts";
import { createWorldDiscoveryComponent } from "../../../src/game/component/worldDiscoveryComponent.ts";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/behaviorSystem.ts";
import { createBehaviorResolver } from "../../../src/game/behavior/behaviorResolver.ts";
import type { Jobs } from "../../../src/game/job/job.ts";
import type { Building } from "../../../src/data/building/building.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { playerKingdomPrefab } from "../../../src/game/prefab/playerKingdomPrefab.ts";
import { goblinCampPrefab } from "../../../src/game/prefab/goblinCampPrefab.ts";
import { goblinPrefab } from "../../../src/game/prefab/goblinPrefab.ts";
import type { EcsSystem } from "../../../src/ecs/ecsSystem.ts";
import type { Point } from "../../../src/common/point.ts";
import type { InventoryItemQuantity } from "../../../src/data/inventory/inventoryItemQuantity.ts";
import { createHousingComponent } from "../../../src/game/component/housingComponent.ts";
import { createFireSourceComponent } from "../../../src/game/component/fireSourceComponent.ts";
import { createPlayerUnitComponent } from "../../../src/game/component/playerUnitComponent.ts";
import { createGameTimeComponent } from "../../../src/game/component/gameTimeComponent.ts";

/**
 * Full-stack scenario test harness for logistics, crafting, and behavior flows.
 * Creates a world with tiles, pathfinding, job queue, and runs a real system
 * pipeline so tests exercise actual behavior selection and action execution.
 *
 * Pass extraSystems to add additional systems (e.g. effectSystem) to the pipeline.
 * Systems run in registration order: chunkMap → preBehaviorSystems → behavior →
 * extraSystems. Use preBehaviorSystems for systems that must influence the same
 * tick's behavior selection (hearth defense does, matching production order).
 */
export class ScenarioHarness {
    root: Entity;
    ecsWorld: EcsWorld;
    currentTick: number = 0;
    private playerUnitCounter = 0;

    constructor(
        extraSystems: EcsSystem[] = [],
        preBehaviorSystems: EcsSystem[] = [],
    ) {
        this.ecsWorld = new EcsWorld();
        this.ecsWorld.addSystem(chunkMapSystem);
        // Discovery follows from movement, buildings and light. Only entities
        // under a player kingdom reveal anything, see addPlayerKingdom.
        this.ecsWorld.addSystem(makeWorldGenSystem(() => {}));
        this.root = this.ecsWorld.root;

        // Set up ground covering at least the play area x=8..39, y=8..31
        const tileComponent = createTileComponent();
        addGroundCovering(tileComponent, { x1: 8, y1: 8, x2: 39, y2: 31 });
        this.root.setEcsComponent(tileComponent);
        this.root.setEcsComponent(createChunkMapComponent());
        this.root.setEcsComponent(
            createPathfindingGraphComponent(
                createLazyGraphFromRootNode(this.root),
            ),
        );

        this.root.setEcsComponent(createJobQueueComponent());
        // Required by the world generation system when a viewer reveals tiles
        this.root.setEcsComponent(createWorldDiscoveryComponent());
        // Behaviors read the current tick through the root, mirroring how the
        // game server exposes its GameTime instance. The source reads the
        // harness tick live, so tick() needs no extra bookkeeping.
        const harness = this;
        this.root.setEcsComponent(
            createGameTimeComponent({
                get tick() {
                    return harness.currentTick;
                },
            }),
        );

        for (const system of preBehaviorSystems) {
            this.ecsWorld.addSystem(system);
        }

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
     * Returns the number of ticks elapsed. Does NOT throw if maxTicks is reached.
     * The calling test asserts on the return value or world state.
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

    /**
     * Add `count` bare player-unit markers (PlayerUnit component only, no
     * behavior). Lets a test set the player population that drives goblin-camp
     * scaling and the raid valve without spawning full, behavior-driven workers.
     * Returns the created entities so a test can remove some to shrink the pop.
     */
    addPlayerUnits(count: number): Entity[] {
        const units: Entity[] = [];
        for (let i = 0; i < count; i++) {
            const n = this.playerUnitCounter++;
            const unit = new Entity(`player-unit-${n}`);
            unit.worldPosition = { x: 8 + (n % 20), y: 8 };
            unit.setEcsComponent(createPlayerUnitComponent());
            this.root.addChild(unit);
            units.push(unit);
        }
        return units;
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
            const stockpileComp =
                stockpile.getEcsComponent(StockpileComponentId)!;
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
            entity.setEcsComponent(
                createHousingComponent(options.tenant ?? null),
            );
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

    /**
     * Add a player kingdom entity using the real playerKingdomPrefab. Player
     * buildings should be added as children of this entity (via addPlayerBuilding)
     * so getSettlementEntity resolves their owner to the kingdom.
     */
    addPlayerKingdom(): Entity {
        const kingdom = playerKingdomPrefab();
        this.root.addChild(kingdom);
        return kingdom;
    }

    /**
     * Add a building owned by the given player kingdom, using the real
     * buildingPrefab. Mirrors how commandSystem parents placed buildings to the
     * kingdom. Pass scaffolded to get a building still under construction.
     */
    addPlayerBuilding(
        kingdom: Entity,
        building: Building,
        position: Point,
        id?: string,
        scaffolded: boolean = false,
    ): Entity {
        const entity = buildingPrefab(building, scaffolded, id);
        kingdom.addChild(entity);
        entity.worldPosition = position;
        return entity;
    }

    /**
     * Add a goblin camp using the real goblinCampPrefab (which includes a
     * campfire child and one initial goblin). Returns the camp and that goblin.
     */
    addGoblinCamp(position: Point): { camp: Entity; goblin: Entity } {
        const { camp, goblin } = goblinCampPrefab();
        this.root.addChild(camp);
        camp.worldPosition = position;
        return { camp, goblin };
    }

    /**
     * Add an additional goblin to a camp using the real goblinPrefab. Used to
     * fill a camp up to its maxPopulation.
     */
    addGoblinToCamp(camp: Entity, position: Point): Entity {
        const goblin = goblinPrefab(camp.id);
        camp.addChild(goblin);
        goblin.worldPosition = position;
        return goblin;
    }

    /**
     * Cover the whole harness world in one biome. Chunks start without one,
     * which suits tests that do not care what grows where. Anything that reads
     * the land (planting, foraging) needs this.
     */
    setBiome(biome: BiomeType): void {
        const tiles = this.root.requireEcsComponent(TileComponentId);
        const volume = testVolume(biome);
        for (const chunk of [...tiles.chunks.values()]) {
            setChunk(tiles, { ...chunk, volume });
        }
    }

    /** Add a natural resource entity, such as a tree, at a position. */
    addResource(resource: NaturalResource, position: Point): Entity {
        const entity = resourcePrefab(resource);
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

    /** Get the count of an item in an entity's held slot. */
    getHeldAmount(entity: Entity, itemId: string): number {
        const held = entity.getEcsComponent(HeldItemComponentId);
        if (!held || !held.item || held.item.id !== itemId) return 0;
        return held.amount;
    }
}
