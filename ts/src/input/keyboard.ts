import { InputActionData } from "./inputAction";
import { Event, EventListener } from "../event/event";

export type KeyboardMap = { [key: string]: InputActionData };

export class Keyboard {
    private keyboardMap: KeyboardMap;
    private _keyEvent: Event<InputActionData>;
    public constructor() {
        this.keyboardMap = getKeyboardMap();
        this._keyEvent = new Event();
        window.addEventListener("keypress", this.onKeyPress);
    }
    public dispose() {
        this._keyEvent.dispose();
    }

    public get keyEvent(): EventListener<InputActionData> {
        return this._keyEvent;
    }

    private onKeyPress = (event: KeyboardEvent) => {
        const action = this.keyboardMap[event.key.toLowerCase()];
        if (!!action) {
            this._keyEvent.publish(action);
        }
    };
}

export function getKeyboardMap(): KeyboardMap {
    const userMap = window.localStorage.getItem(UserKeyboardMapStorageKey);
    if (!!userMap) {
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
export const DefaultKeyboardMap: KeyboardMap = {};
