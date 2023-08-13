import { AssetLoader } from "../../../asset/loader/assetLoader.js";
import { GameTime } from "../../../common/time.js";
import { Camera } from "../../../rendering/camera.js";
import { Entity } from "../../world/entity/entity.js";
import { InteractionStateChanger } from "./interactionStateChanger.js";

export interface StateContext {
    world: Entity;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
}
