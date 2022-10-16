import { World } from "../../world";
import { InteractionStateChanger } from "./interactionStateChanger";

export interface StateContext {
    world: World;
    stateChanger: InteractionStateChanger;
}
