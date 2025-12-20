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
import { effectSystem } from "../game/system/effectSystem.js";
import { createTileComponent } from "../game/component/tileComponent.js";
import { getOverworldEntity } from "../game/map/scenes.js";
import { housingSystem } from "../game/system/housingSystem.js";
import { regrowSystem } from "../game/system/regrowSystem.js";

export class GameServer {
    private world: EcsWorld;
    private updateTick = 0;

    constructor(private postMessage: (message: GameMessage) => void) {
        this.world = new EcsWorld();
        this.addComponents();
        this.addSystems();
        console.log("Creating game server");
        this.world.runInit();
        setInterval(() => {
            this.updateTick += 1;
            this.world.runUpdate(this.updateTick);
        }, 1000);
    }

    private addComponents() {
        const overworld = getOverworldEntity(this.world.root);
        overworld.setEcsComponent(createTileComponent());
        this.world.root.setEcsComponent(
            createEffectEmitterComponent((effect) => {
                this.postMessage({
                    type: "effect",
                    effect,
                });
            }),
        );
        overworld.setEcsComponent(createWorldDiscoveryComponent());
    }

    private addSystems() {
        this.world.addSystem(chunkMapSystem);
        this.world.addSystem(pathfindingSystem);
        this.world.addSystem(worldGenerationSystem);
        this.world.addSystem(JobSystem);
        this.world.addSystem(commandSystem);
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
