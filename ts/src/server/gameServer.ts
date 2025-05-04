import { createServerDispatcher } from "../game/action/dispatcher/serverDispatcher.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { JobSystem } from "../game/system/jobSystem.js";
import { pathfindingSystem } from "../game/system/pathfindingSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import type { ActionDispatcher } from "../module/action/actionDispatcher.js";
import type { EntityAction } from "../module/action/entityAction.js";
import { EcsWorld } from "../module/ecs/ecsWorld.js";
import {
    GameServerMessageBus,
    type GameServerMessage,
} from "./gameServerMessageBus.js";
import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";

export class GameServer {
    private world: EcsWorld;
    private actionDispatcher: ActionDispatcher;

    constructor(private messageBus: GameServerMessageBus) {
        this.world = new EcsWorld();
        this.actionDispatcher = createServerDispatcher(this.world.root);
        this.world.root.actionDispatch = (action: EntityAction) => {
            this.actionDispatcher(action);
            messageBus.postMessage({
                id: "entityAction",
                entityAction: action,
            });
        };
        this.addSystems();
        this.world.runInit();
        setInterval(() => {
            this.world.runUpdate(0);
        }, 1000);
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(
            makeReplicatedEntitiesSystem((message) => {
                this.messageBus.postMessage(message);
            }),
        );
        this.world.addSystem(JobSystem);
    }

    onCommand(message: GameServerMessage) {
        for (const entry of message.entries) {
            console.log("Recieved message in server: ", entry);
            if (entry.id == "entityAction") {
                this.actionDispatcher(entry.entityAction);
            }
        }
    }
}
