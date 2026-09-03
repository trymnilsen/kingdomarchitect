import { AssetLoader } from "../../../asset/loader/assetLoader.ts";
import type { EcsWorld } from "../../../ecs/ecsWorld.ts";
import { GameTime } from "../../gameTime.ts";
import { Camera } from "../../../rendering/camera.ts";
import type { GameSaveCapability } from "../../../server/gameServerConnection.ts";
import type { GameCommand } from "../../../server/message/gameCommand.ts";
import { Entity } from "../../entity/entity.ts";
import type { WorldOverlays } from "../overlay/worldOverlays.ts";
import type { InteractionStateChanger } from "./interactionStateChanger.ts";

export type StateContext = {
    root: Entity;
    world: EcsWorld;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
    commandDispatcher: (command: GameCommand) => void;
    worldOverlays: WorldOverlays;
    gameSaveCapability?: GameSaveCapability;
};
