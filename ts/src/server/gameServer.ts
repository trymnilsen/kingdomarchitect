import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { JobSystem } from "../game/system/jobSystem.js";
import { pathfindingSystem } from "../game/system/pathfindingSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import { EcsWorld } from "../common/ecs/ecsWorld.js";

import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";
import type { GameCommand } from "../game/command/gameCommand.js";

export class GameServer {
    private world: EcsWorld;

    constructor() {
        this.world = new EcsWorld();
        //Add the discovery component to the server scene, this is used only on
        //the server to keep track of which tiles players have discovered
        this.world.root.setEcsComponent(createWorldDiscoveryComponent());
        /*
        this.world.root.actionDispatch = (action: EntityAction) => {
            this.actionDispatcher(action);
            messageBus.postMessage({
                id: "entityAction",
                entityAction: action,
            });
        };*/
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
        this.world.addSystem(JobSystem);
    }

    onCommand(_command: GameCommand) {
        /*
        for (const entry of message.entries) {
            console.log("Recieved message in server: ", entry);
            if (entry.id == "entityAction") {
                //this.actionDispatcher(entry.entityAction);
            }
        }*/
    }
}
