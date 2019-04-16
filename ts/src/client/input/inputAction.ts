import { Action } from "../../common/simulation/action";

export enum InputActionData {
    LEFT_PRESS = "LEFT_PRESS",
    RIGHT_PRESS = "RIGHT_PRESS",
    UP_PRESS = "UP_PRESS",
    DOWN_PRESS = "DOWN_PRESS"
}

export type InputAction = Action<InputActionData>;
export const InputActionName = "inputAction";
