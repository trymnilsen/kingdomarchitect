"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inputAction_1 = require("./inputAction");
const event_1 = require("../event/event");
class Keyboard {
    constructor() {
        this.onKeyPress = (event) => {
            const action = this.keyboardMap[event.key.toLowerCase()];
            if (!!action) {
                this._keyEvent.publish(action);
            }
        };
        this.keyboardMap = getKeyboardMap();
        this._keyEvent = new event_1.Event();
        window.addEventListener("keydown", this.onKeyPress);
    }
    dispose() {
        this._keyEvent.dispose();
    }
    get keyEvent() {
        return this._keyEvent;
    }
}
exports.Keyboard = Keyboard;
function getKeyboardMap() {
    const userMap = window.localStorage.getItem(exports.UserKeyboardMapStorageKey);
    if (!!userMap) {
        try {
            return JSON.parse(userMap);
        }
        catch (err) {
            console.error("Failed to parse user keyboard map", err);
            return exports.DefaultKeyboardMap;
        }
    }
    console.debug("No keyboardmap defined, returning default", exports.DefaultKeyboardMap);
    return exports.DefaultKeyboardMap;
}
exports.getKeyboardMap = getKeyboardMap;
exports.UserKeyboardMapStorageKey = "KEYBOARD_USER_MAP";
exports.DefaultKeyboardMap = {
    d: inputAction_1.InputActionData.RIGHT_PRESS,
    a: inputAction_1.InputActionData.LEFT_PRESS,
    w: inputAction_1.InputActionData.UP_PRESS,
    s: inputAction_1.InputActionData.DOWN_PRESS,
    q: inputAction_1.InputActionData.BACK_PRESS,
    e: inputAction_1.InputActionData.ACTION_PRESS,
    j: inputAction_1.InputActionData.SELECT_PRESS,
    k: inputAction_1.InputActionData.START_PRESS
};
//# sourceMappingURL=keyboard.js.map