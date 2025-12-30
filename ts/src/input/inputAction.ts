import { Direction } from "../common/direction.ts";

export const InputActionType = {
    LEFT_PRESS: "LEFT_PRESS",
    RIGHT_PRESS: "RIGHT_PRESS",
    UP_PRESS: "UP_PRESS",
    DOWN_PRESS: "DOWN_PRESS",
    ACTION_PRESS: "ACTION_PRESS",
    BACK_PRESS: "BACK_PRESS",
    MENU_PRESS: "MENU_PRESS",
    NUMBER_PRESS: "NUMBER_PRESS",
} as const;

export type InputActionType =
    (typeof InputActionType)[keyof typeof InputActionType];

export type InputAction = {
    isShifted: boolean;
    action: InputActionType;
    value: string;
};

export function getDirectionFromInputType(
    action: InputActionType,
): Direction | null {
    let direction: Direction | null = null;
    switch (action) {
        case InputActionType.LEFT_PRESS:
            direction = Direction.Left;
            break;
        case InputActionType.RIGHT_PRESS:
            direction = Direction.Right;
            break;
        case InputActionType.UP_PRESS:
            direction = Direction.Up;
            break;
        case InputActionType.DOWN_PRESS:
            direction = Direction.Down;
            break;
        default:
            break;
    }

    return direction;
}

export const InputActionName = "inputAction";
