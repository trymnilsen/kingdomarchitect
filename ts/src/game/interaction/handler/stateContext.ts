import { AssetLoader } from "../../../asset/loader/assetLoader.js";
import type { EcsWorld } from "../../../common/ecs/ecsWorld.js";
import { GameTime } from "../../../common/time.js";
import { Camera } from "../../../rendering/camera.js";
import type { GameCommand } from "../../../server/message/gameCommand.js";
import { Entity } from "../../entity/entity.js";
import { InteractionStateChanger } from "./interactionStateChanger.js";

export type StateContext = {
    root: Entity;
    world: EcsWorld;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
    commandDispatcher: (command: GameCommand) => void;
};
