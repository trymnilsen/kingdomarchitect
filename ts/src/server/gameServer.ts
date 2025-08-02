import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { JobSystem } from "../game/system/jobSystem.js";
import { pathfindingSystem } from "../game/system/pathfindingSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import { EcsWorld } from "../common/ecs/ecsWorld.js";

import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";
import type { GameCommand } from "../game/message/gameCommand.js";
import { createEffectEmitterComponent } from "../game/component/effectEmitter.js";

export class GameServer {
    private world: EcsWorld;

    constructor() {
        this.world = new EcsWorld();
        this.addComponents();
        this.addSystems();
        this.world.runInit();
        setInterval(() => {
            this.world.runUpdate(0);
        }, 1000);
    }

    private addComponents() {
        this.world.root.setEcsComponent(createEffectEmitterComponent());
        this.world.root.setEcsComponent(createWorldDiscoveryComponent());
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(JobSystem);
        this.world.addSystem(makeReplicatedEntitiesSystem(() => {}));
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
