import { AssetLoader } from "../../../asset/loader/assetLoader.js";
import { GameTime } from "../../../common/time.js";
import { Camera } from "../../../rendering/camera.js";
import { World } from "../../world/world.js";
import { InteractionStateChanger } from "./interactionStateChanger.js";

export interface StateContext {
    world: World;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
}
