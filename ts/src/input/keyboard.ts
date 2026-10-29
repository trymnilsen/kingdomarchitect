import { log } from "../common/logging/logger.ts";
import { type InputAction, InputActionType } from "./inputAction.ts";
import { Event, type EventListener } from "../common/event.ts";

export type KeyboardMap = Record<string, InputActionType>;

export class Keyboard {
    private keyboardMap: KeyboardMap;
    private _keyEvent: Event<InputAction>;

    constructor() {
        this.keyboardMap = getKeyboardMap();
        this._keyEvent = new Event();
        window.addEventListener("keydown", this.onKeyPress);
    }
    dispose() {
        this._keyEvent.dispose();
    }

    get keyEvent(): EventListener<InputAction> {
        return this._keyEvent;
    }

    private onKeyPress = (event: KeyboardEvent) => {
        if (!isGameKeyPress(event)) {
            return;
        }
        const action = this.keyboardMap[event.key.toLowerCase()];
        if (action) {
            // Keys the game uses are not also browser shortcuts. Tab would
            // otherwise move browser focus off the canvas and space or the
            // arrows would scroll the page.
            event.preventDefault();
            this._keyEvent.publish({
                action: action,
                isShifted: event.shiftKey,
                value: event.key,
            });
        }
    };
}

/**
 * Whether a key press is meant for the game. A press with Ctrl, Alt or Meta is
 * a browser or system shortcut, like Ctrl+R to reload, and typing into a text
 * field is not playing. Neither should act in the game or be kept from the
 * browser.
 */
export function isGameKeyPress(
    event: Pick<KeyboardEvent, "ctrlKey" | "altKey" | "metaKey" | "target">,
): boolean {
    if (event.ctrlKey || event.altKey || event.metaKey) {
        return false;
    }
    const element = event.target as Partial<HTMLElement> | null;
    const isEditable =
        element?.isContentEditable === true ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName ?? "");
    return !isEditable;
}

export function getKeyboardMap(): KeyboardMap {
    const userMap = window.localStorage.getItem(UserKeyboardMapStorageKey);
    if (userMap) {
        try {
            return JSON.parse(userMap) as KeyboardMap;
        } catch (err) {
            log.error("Failed to parse user keyboard map", { error: err });
            return DefaultKeyboardMap;
        }
    }
    log.debug("No keyboardmap defined, returning default", {
        map: DefaultKeyboardMap,
    });
    return DefaultKeyboardMap;
}

export const UserKeyboardMapStorageKey = "KEYBOARD_USER_MAP";
export const DefaultKeyboardMap: KeyboardMap = {
    d: InputActionType.RIGHT_PRESS,
    a: InputActionType.LEFT_PRESS,
    w: InputActionType.UP_PRESS,
    s: InputActionType.DOWN_PRESS,
    arrowright: InputActionType.RIGHT_PRESS,
    arrowleft: InputActionType.LEFT_PRESS,
    arrowup: InputActionType.UP_PRESS,
    arrowdown: InputActionType.DOWN_PRESS,
    q: InputActionType.BACK_PRESS,
    escape: InputActionType.BACK_PRESS,
    e: InputActionType.ACTION_PRESS,
    enter: InputActionType.ACTION_PRESS,
    " ": InputActionType.ACTION_PRESS,
    tab: InputActionType.FOCUS_CYCLE_PRESS,
    m: InputActionType.FOCUS_CYCLE_PRESS,
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
