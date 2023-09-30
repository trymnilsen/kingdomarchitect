import { InputAction, InputActionType } from "./inputAction.js";
import { Event, EventListener } from "../common/event.js";

export type KeyboardMap = { [key: string]: InputActionType };

export class Keyboard {
    private keyboardMap: KeyboardMap;
    private _keyEvent: Event<InputAction>;

    public constructor() {
        this.keyboardMap = getKeyboardMap();
        this._keyEvent = new Event();
        window.addEventListener("keydown", this.onKeyPress);
    }
    public dispose() {
        this._keyEvent.dispose();
    }

    public get keyEvent(): EventListener<InputAction> {
        return this._keyEvent;
    }

    private onKeyPress = (event: KeyboardEvent) => {
        const action = this.keyboardMap[event.key.toLowerCase()];
        if (action) {
            this._keyEvent.publish({
                action: action,
                isShifted: event.shiftKey,
                value: event.key,
            });
        }
    };
}

export function getKeyboardMap(): KeyboardMap {
    const userMap = window.localStorage.getItem(UserKeyboardMapStorageKey);
    if (userMap) {
        try {
            return JSON.parse(userMap) as KeyboardMap;
        } catch (err) {
            console.error("Failed to parse user keyboard map", err);
            return DefaultKeyboardMap;
        }
    }
    console.debug(
        "No keyboardmap defined, returning default",
        DefaultKeyboardMap
    );
    return DefaultKeyboardMap;
}

export const UserKeyboardMapStorageKey = "KEYBOARD_USER_MAP";
export const DefaultKeyboardMap: KeyboardMap = {
    d: InputActionType.RIGHT_PRESS,
    a: InputActionType.LEFT_PRESS,
    w: InputActionType.UP_PRESS,
    s: InputActionType.DOWN_PRESS,
    q: InputActionType.BACK_PRESS,
    e: InputActionType.ACTION_PRESS,
    r: InputActionType.MENU_PRESS,
    1: InputActionType.NUMBER_PRESS,
    2: InputActionType.NUMBER_PRESS,
    3: InputActionType.NUMBER_PRESS,
    4: InputActionType.NUMBER_PRESS,
    5: InputActionType.NUMBER_PRESS,
    6: InputActionType.NUMBER_PRESS,
    7: InputActionType.NUMBER_PRESS,
    8: InputActionType.NUMBER_PRESS,
    9: InputActionType.NUMBER_PRESS,
    0: InputActionType.NUMBER_PRESS,
};
