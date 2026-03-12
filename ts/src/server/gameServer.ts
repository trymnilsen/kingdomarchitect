import { createLogger } from "../common/logging/logger.ts";
import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.ts";
import { GameTime } from "../game/gameTime.ts";
import { chunkMapSystem } from "../game/system/chunkMapSystem.ts";
import { pathfindingSystem } from "../game/system/pathfindingSystem.ts";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.ts";
import { EcsWorld } from "../common/ecs/ecsWorld.ts";
import { createRootEntity } from "../game/rootFactory.ts";
import { hungerSystem } from "../game/system/hungerSystem.ts";
import { createJobNotificationSystem } from "../game/system/jobNotificationSystem.ts";
import { createBehaviorSystem } from "../game/behavior/systems/BehaviorSystem.ts";
import { createBehaviorResolver } from "../game/behavior/behaviorResolver.ts";
import { warmthSystem } from "../game/system/warmthSystem.ts";
import { goblinCampSystem } from "../game/system/goblinCampSystem.ts";

import {
    buildWorldStateMessage,
    makeReplicatedEntitiesSystem,
} from "./replicatedEntitiesSystem.ts";
import type { GameCommand } from "./message/gameCommand.ts";
import { createMessageEmitterComponent } from "../game/component/messageEmitterComponent.ts";
import {
    DiscoverTileGameMessageType,
    type DiscoverTileGameMessage,
    type GameMessage,
} from "./message/gameMessage.ts";
import { createCommandSystem } from "../game/system/commandSystem.ts";
import { createEffectSystem } from "../game/system/effectSystem.ts";
import { createEffectExecutorMap } from "../data/effect/effectExecutorRegistry.ts";
import { housingSystem } from "../game/system/housingSystem.ts";
import { regrowSystem } from "../game/system/regrowSystem.ts";
import { PersistenceManager } from "./persistence/persistenceManager.ts";
import type { PersistenceAdapter } from "./persistence/persistenceAdapter.ts";
import type { Entity } from "../game/entity/entity.ts";
import { TileComponentId } from "../game/component/tileComponent.ts";
import { WorldDiscoveryComponentId } from "../game/component/worldDiscoveryComponent.ts";
import { getPlayerDiscoveryData } from "./message/playerDiscoveryData.ts";
import { ToggleableCallback } from "../common/toggleableCallback.ts";
import type { MessageRouter } from "./messageRouter.ts";

const log = createLogger("persistence");

export class GameServer {
    private world: EcsWorld;
    private updateTick = 0;
    private gameTime = new GameTime();
    private persistenceManager: PersistenceManager;
    private worldSeed: number;
    private gameLoopInterval?: ReturnType<typeof setInterval>;
    private broadcastCallback: ToggleableCallback<[GameMessage]>;
    private messageRouter: MessageRouter;
    private onPlayerConnectedCallback?: (playerId: string) => void;

    constructor(
        messageRouter: MessageRouter,
        adapter: PersistenceAdapter,
        onPlayerConnected?: (playerId: string) => void,
    ) {
        this.messageRouter = messageRouter;
        this.onPlayerConnectedCallback = onPlayerConnected;
        this.broadcastCallback = new ToggleableCallback(
            (message: GameMessage) => messageRouter.broadcast(message),
            false,
        );
        const root = createRootEntity();

        this.world = new EcsWorld(root);

        this.worldSeed = Date.now();
        this.persistenceManager = new PersistenceManager(adapter);
    }

    async init(initialPlayerId?: string): Promise<void> {
        this.world.root.setEcsComponent(
            createMessageEmitterComponent((message) => {
                this.broadcastCallback.invoke(message);
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
        this.broadcastCallback.enable();

        if (initialPlayerId) {
            this.handlePlayerConnected(initialPlayerId);
        }

        this.gameLoopInterval = setInterval(() => {
            this.updateTick += 1;
            this.gameTime.setTick(this.updateTick);
            (globalThis as Record<string, unknown>)["currentTick"] = this.updateTick;
            this.world.runUpdate(this.updateTick);

            if (this.updateTick % 10 === 0) {
                this.autoSave();
            }
        }, 1000);
    }

    /**
     * Handles a player connecting: sends them the full world state and
     * discovery data. Invokes the onPlayerConnected callback if set.
     */
    handlePlayerConnected(playerId: string): void {
        if (this.onPlayerConnectedCallback) {
            this.onPlayerConnectedCallback(playerId);
        }
        this.sendWorldStateTo(playerId);
    }

    /**
     * Sends the full world state and discovery data to a specific player.
     */
    private sendWorldStateTo(playerId: string): void {
        this.messageRouter.sendTo(
            playerId,
            buildWorldStateMessage(this.world.root, playerId),
        );

        const message = this.buildDiscoverTileMessage(playerId);
        if (message) {
            this.messageRouter.sendTo(playerId, message);
        }
    }

    private buildDiscoverTileMessage(
        playerId: string,
    ): DiscoverTileGameMessage | null {
        const tileComponent = this.world.root.getEcsComponent(TileComponentId);
        const discoveryComponent = this.world.root.getEcsComponent(
            WorldDiscoveryComponentId,
        );

        if (!tileComponent || !discoveryComponent) {
            return null;
        }

        const playerDiscovery =
            discoveryComponent.discoveriesByUser.get(playerId);
        if (!playerDiscovery) {
            return null;
        }

        const data = getPlayerDiscoveryData(tileComponent, playerDiscovery);
        if (!data) {
            return null;
        }

        return {
            type: DiscoverTileGameMessageType,
            tiles: data.tiles,
            volumes: data.volumes,
        };
    }

    private async loadGame(): Promise<void> {
        const meta = await this.persistenceManager.loadMeta();
        if (meta) {
            this.worldSeed = meta.seed;
            this.updateTick = meta.tick;
            this.gameTime.setTick(meta.tick);
            log.info("Loading save", { tick: meta.tick, seed: meta.seed });
        }

        log.info("Loading world");
        await this.persistenceManager.load(this.world.root);
        log.info("Load complete");
    }

    private async autoSave(): Promise<void> {
        try {
            await this.saveGame();
        } catch (err) {
            log.error("Auto-save failed", { err });
        }
    }

    async saveGame(): Promise<void> {
        await this.persistenceManager.saveWorld(this.world.root);
        await this.persistenceManager.saveMeta({
            version: 1,
            tick: this.updateTick,
            seed: this.worldSeed,
        });
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        // Effect system runs before behavior so stat modifiers are current when behaviors evaluate
        this.world.addSystem(createEffectSystem(createEffectExecutorMap()));
        this.world.addSystem(createBehaviorSystem(createBehaviorResolver()));
        this.world.addSystem(createJobNotificationSystem());
        this.world.addSystem(hungerSystem);
        this.world.addSystem(warmthSystem);
        this.world.addSystem(goblinCampSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(
            createCommandSystem(this.gameTime, this.persistenceManager),
        );
        this.world.addSystem(housingSystem);
        this.world.addSystem(regrowSystem);
        this.world.addSystem(
            makeReplicatedEntitiesSystem((message) => {
                this.broadcastCallback.invoke(message);
            }),
        );
    }

    onMessage(message: GameMessage, _playerId?: string) {
        this.world.runGameMessage(message);
    }
}
