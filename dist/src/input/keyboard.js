function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { InputActionType } from "./inputAction.js";
import { Event } from "../common/event.js";
export class Keyboard {
    dispose() {
        this._keyEvent.dispose();
    }
    get keyEvent() {
        return this._keyEvent;
    }
    constructor(){
        _define_property(this, "keyboardMap", void 0);
        _define_property(this, "_keyEvent", void 0);
        _define_property(this, "onKeyPress", (event)=>{
            const action = this.keyboardMap[event.key.toLowerCase()];
            if (!!action) {
                this._keyEvent.publish({
                    action: action,
                    isShifted: event.shiftKey,
                    value: event.key
                });
            }
        });
        this.keyboardMap = getKeyboardMap();
        this._keyEvent = new Event();
        window.addEventListener("keydown", this.onKeyPress);
    }
}
export function getKeyboardMap() {
    const userMap = window.localStorage.getItem(UserKeyboardMapStorageKey);
    if (!!userMap) {
        try {
            return JSON.parse(userMap);
        } catch (err) {
            console.error("Failed to parse user keyboard map", err);
            return DefaultKeyboardMap;
        }
    }
    console.debug("No keyboardmap defined, returning default", DefaultKeyboardMap);
    return DefaultKeyboardMap;
}
export const UserKeyboardMapStorageKey = "KEYBOARD_USER_MAP";
export const DefaultKeyboardMap = {
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
    0: InputActionType.NUMBER_PRESS
};
