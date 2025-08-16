import { createWorldDiscoveryComponent } from "../game/component/worldDiscoveryComponent.js";
import { chunkMapSystem } from "../game/system/chunkMapSystem.js";
import { JobSystem } from "../game/system/jobSystem.js";
import { pathfindingSystem } from "../game/system/pathfindingSystem.js";
import { worldGenerationSystem } from "../game/system/worldGenerationSystem.js";
import { EcsWorld } from "../common/ecs/ecsWorld.js";

import { makeReplicatedEntitiesSystem } from "./replicatedEntitiesSystem.js";
import type { GameCommand } from "./message/gameCommand.js";
import { createEffectEmitterComponent } from "../game/component/effectEmitterComponent.js";
import type { GameMessage } from "./message/gameMessage.js";
import { commandSystem } from "../game/system/commandSystem.js";

export class GameServer {
    private world: EcsWorld;

    constructor(private postMessage: (message: GameMessage) => void) {
        this.world = new EcsWorld();
        this.addComponents();
        this.addSystems();
        console.log("Creating game server");
        this.world.runInit();
        setInterval(() => {
            this.world.runUpdate(0);
        }, 1000);
    }

    private addComponents() {
        this.world.root.setEcsComponent(
            createEffectEmitterComponent((effect) => {
                this.postMessage({
                    type: "effect",
                    effect,
                });
            }),
        );
        this.world.root.setEcsComponent(createWorldDiscoveryComponent());
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(JobSystem);
        this.world.addSystem(commandSystem);
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
