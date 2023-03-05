import { AssetLoader } from "../../../asset/loader/assetLoader";
import { GameTime } from "../../../common/time";
import { World } from "../../world/world";
import { InteractionStateChanger } from "./interactionStateChanger";

export interface StateContext {
    world: World;
    stateChanger: InteractionStateChanger;
    assets: AssetLoader;
    gameTime: GameTime;
}
