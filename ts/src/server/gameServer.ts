import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.js";
import { GameTime } from "../game/gameTime.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { craftingSystem } from "../game/system/craftingSystem.js";
import { JobSystem } from "../game/system/jobSystem.js";
import { pathfindingSystem } from "../game/system/pathfindingSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import { EcsWorld } from "../common/ecs/ecsWorld.js";
import { createRootEntity } from "../game/rootFactory.js";

import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";
import type { GameCommand } from "./message/gameCommand.js";
import {
    createEffectEmitterComponent,
    EffectEmitterComponentId,
} from "../game/component/effectEmitterComponent.js";
import type { GameMessage } from "./message/gameMessage.js";
import { createCommandSystem } from "../game/system/commandSystem.js";
import { effectSystem } from "../game/system/effectSystem.js";
import { getOverworldEntity } from "../game/map/scenes.js";
import { housingSystem } from "../game/system/housingSystem.js";
import { regrowSystem } from "../game/system/regrowSystem.js";
import { PersistenceManager } from "./persistence/persistenceManager.js";
import { IndexedDBAdapter } from "./persistence/indexedDBAdapter.js";
import type { Entity } from "../game/entity/entity.js";
import { buildDiscoveryEffectForPlayer } from "./message/effect/discoverTileEffect.js";

export class GameServer {
    private world: EcsWorld;
    private updateTick = 0;
    private gameTime = new GameTime();
    private persistenceManager: PersistenceManager;
    private worldSeed: number;
    private gameLoopInterval?: ReturnType<typeof setInterval>;

    constructor(private postMessage: (message: GameMessage) => void) {
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
        await this.world.suspendEvents(async () => {
            await this.persistenceManager.load(this.world.root);
        });

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
        console.log(
            `Saved game at tick ${this.updateTick} in ${end - start} ms`,
        );
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(JobSystem);
        this.world.addSystem(createCommandSystem(this.gameTime));
        this.world.addSystem(craftingSystem);
        this.world.addSystem(housingSystem);
        this.world.addSystem(effectSystem);
        this.world.addSystem(regrowSystem);
        this.world.addSystem(
            makeReplicatedEntitiesSystem((message) => {
                this.postMessage(message);
            }),
        );
    }

    onMessage(message: GameMessage) {
        this.world.runGameMessage(message);
    }
}
