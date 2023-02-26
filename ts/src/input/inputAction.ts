export enum InputActionType {
    LEFT_PRESS = "LEFT_PRESS",
    RIGHT_PRESS = "RIGHT_PRESS",
    UP_PRESS = "UP_PRESS",
    DOWN_PRESS = "DOWN_PRESS",
    ACTION_PRESS = "ACTION_PRESS",
    BACK_PRESS = "BACK_PRESS",
    MENU_PRESS = "MENU_PRESS",
    NUMBER_PRESS = "NUMBER_PRESS",
}

export interface InputAction {
    isShifted: boolean;
    action: InputActionType;
    value: string;
}

export const InputActionName = "inputAction";
