import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.ts";
import { GameTime } from "../game/gameTime.ts";
import { chunkMapSystem } from "../game/system/chunkMapSystem.ts";
import { pathfindingSystem } from "../game/system/pathfindingSystem.ts";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.ts";
import { EcsWorld } from "../common/ecs/ecsWorld.ts";
import { createRootEntity } from "../game/rootFactory.ts";
import { hungerSystem } from "../game/system/hungerSystem.ts";
import { energySystem } from "../game/system/energySystem.ts";
import { createJobNotificationSystem } from "../game/system/jobNotificationSystem.ts";
import { createBehaviorSystem } from "../game/behavior/systems/BehaviorSystem.ts";
import { createPerformPlayerCommandBehavior } from "../game/behavior/behaviors/PerformPlayerCommandBehavior.ts";
import { createSleepBehavior } from "../game/behavior/behaviors/SleepBehavior.ts";
import { createPerformJobBehavior } from "../game/behavior/behaviors/PerformJobBehavior.ts";

import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.ts";
import type { GameCommand } from "./message/gameCommand.ts";
import {
    createEffectEmitterComponent,
    EffectEmitterComponentId,
} from "../game/component/effectEmitterComponent.ts";
import type { GameMessage } from "./message/gameMessage.ts";
import { createCommandSystem } from "../game/system/commandSystem.ts";
import { effectSystem } from "../game/system/effectSystem.ts";
import { getOverworldEntity } from "../game/map/scenes.ts";
import { housingSystem } from "../game/system/housingSystem.ts";
import { regrowSystem } from "../game/system/regrowSystem.ts";
import { PersistenceManager } from "./persistence/persistenceManager.ts";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.ts";
import type { Entity } from "../game/entity/entity.ts";
import { buildDiscoveryEffectForPlayer } from "./message/effect/discoverTileEffect.ts";

export class GameServer {
    private world: EcsWorld;
    private updateTick = 0;
    private gameTime = new GameTime();
    private persistenceManager: PersistenceManager;
    private worldSeed: number;
    private gameLoopInterval?: ReturnType<typeof setInterval>;
    private postMessage: (message: GameMessage) => void;

    constructor(postMessage: (message: GameMessage) => void) {
        this.postMessage = postMessage;
        const root = createRootEntity();
        this.world = new EcsWorld(root);
        this.worldSeed = Date.now();
        const adapter = new IndexedDBAdapter();
        this.persistenceManager = new PersistenceManager(adapter);
    }

    async init(): Promise<void> {
        const adapter = this.persistenceManager["adapter"] as IndexedDBAdapter;
        await adapter.init();

        this.world.root.setEcsComponent(
            createEffectEmitterComponent((effect) => {
                this.postMessage({
                    type: "effect",
                    effect,
                });
            }),
        );
        this.addSystems();

        const hasSave = await this.persistenceManager.hasSave();
        if (hasSave) {
            await this.loadGame();
        }

        // Run init after loading (or if no save exists)
        // worldGenerationSystem will see loaded entities and skip generation
        this.world.runInit();

        this.gameLoopInterval = setInterval(() => {
            this.updateTick += 1;
            this.gameTime.setTick(this.updateTick);
            this.world.runUpdate(this.updateTick);

            if (this.updateTick % 10 === 0) {
                this.autoSave();
            }
        }, 1000);
    }

    private async loadGame(): Promise<void> {
        const meta = await this.persistenceManager.loadMeta();
        if (meta) {
            this.worldSeed = meta.seed;
            this.updateTick = meta.tick;
            this.gameTime.setTick(meta.tick);
            console.log(
                `Loading save from tick ${meta.tick} with seed ${meta.seed}`,
            );
        }

        // Suspend events during load to prevent systems from reacting
        // before runtime components are initialized
        console.log("[loadGame] Start load");
        //await this.world.suspendEvents(async () => {
        console.log("[loadGame] Loading");
        await this.persistenceManager.load(this.world.root);
        console.log("[loadGame] Load complete");
        // });
        console.log("[loadGame] Finished load");
        // After loading, send discovery effect for all loaded tiles
        this.sendDiscoveryEffectForLoadedWorld();
    }

    /**
     * Sends a discovery effect containing all tiles and volumes from the loaded world.
     * This ensures the client receives tile data after a game is loaded.
     * Only sends tiles that were actually discovered by the player.
     */
    private sendDiscoveryEffectForLoadedWorld(): void {
        const overworld = getOverworldEntity(this.world.root);
        const effect = buildDiscoveryEffectForPlayer(overworld, "player");

        if (!effect) {
            return;
        }

        // Send discovery effect
        const effectEmitter = this.world.root.requireEcsComponent(
            EffectEmitterComponentId,
        );
        effectEmitter.emitter(effect);
    }

    private async autoSave(): Promise<void> {
        try {
            await this.saveGame();
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
    }

    async saveGame(): Promise<void> {
        const start = performance.now();
        await this.persistenceManager.saveWorld(this.world.root);
        await this.persistenceManager.saveMeta({
            version: 1,
            tick: this.updateTick,
            seed: this.worldSeed,
        });
        const end = performance.now();
        /*
        console.log(
            `Saved game at tick ${this.updateTick} in ${end - start} ms`,
        );*/
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);

        // Create behaviors for the behavior system
        const behaviors = [
            createPerformPlayerCommandBehavior(), // Priority 90
            createSleepBehavior(), // Priority 60-80 (scales with tiredness)
            createPerformJobBehavior(), // Priority 50
        ];
        this.world.addSystem(createBehaviorSystem(behaviors));

        this.world.addSystem(createJobNotificationSystem());
        this.world.addSystem(hungerSystem);
        this.world.addSystem(energySystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(
            createCommandSystem(this.gameTime, this.persistenceManager),
        );
        this.world.addSystem(housingSystem);
        this.world.addSystem(effectSystem);
        this.world.addSystem(regrowSystem);
        this.world.addSystem(
            makeReplicatedEntitiesSystem((message) => {
                console.log(`Sending replication message:`, message);
                this.postMessage(message);
            }),
        );
    }

    onMessage(message: GameMessage) {
        this.world.runGameMessage(message);
    }
}
