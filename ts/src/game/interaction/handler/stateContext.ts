import { AssetLoader } from "../../../asset/loader/assetLoader.ts";
import type { EcsWorld } from "../../../common/ecs/ecsWorld.ts";
import { GameTime } from "../../../common/time.ts";
import { Camera } from "../../../rendering/camera.ts";
import type { GameCommand } from "../../../server/message/gameCommand.ts";
import { Entity } from "../../entity/entity.ts";
import { InteractionStateChanger } from "./interactionStateChanger.ts";

export type StateContext = {
    root: Entity;
    world: EcsWorld;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
    commandDispatcher: (command: GameCommand) => void;
};
