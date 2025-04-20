import { createRootDispatcher } from "../game/action/dispatcher/rootDispatcher.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import type { ActionDispatcher } from "../module/action/actionDispatcher.js";
import type { EntityAction } from "../module/action/entityAction.js";
import { EcsWorld } from "../module/ecs/ecsWorld.js";
import { GameServerMessageBus } from "./gameServerMessageBus.js";
import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";

export class GameServer {
    private world: EcsWorld;
    private actionDispatcher: ActionDispatcher;

    constructor(private messageBus: GameServerMessageBus) {
        this.world = new EcsWorld();
        this.actionDispatcher = createRootDispatcher(this.world.root);
        this.world.root.actionDispatch = (action: EntityAction) => {
            messageBus.postMessage({
                id: "entityAction",
                entityAction: action,
            });
            this.actionDispatcher(action);
        };
        this.addSystems();
        this.world.runInit();
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(
            makeReplicatedEntitiesSystem((message) => {
                this.messageBus.postMessage(message);
            }),
        );
    }
    onCommand(_message: any) {}
}
