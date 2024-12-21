import { AssetLoader } from "../../../asset/loader/assetLoader.js";
import { GameTime } from "../../../common/time.js";
import { EcsWorldScope } from "../../../ecs/ecsWorldScope.js";
import { Camera } from "../../../rendering/camera.js";
import { Entity } from "../../entity/entity.js";
import { InteractionStateChanger } from "./interactionStateChanger.js";

export type StateContext = {
    root: Entity;
    world: EcsWorldScope;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
    camera: Camera;
};
