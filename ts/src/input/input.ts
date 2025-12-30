import { InputAction } from "./inputAction.ts";
import { Keyboard } from "./keyboard.ts";
import { Event, EventListener } from "../common/event.ts";

export type InputEvent = {
    action: InputAction;
    inputType: InputType;
};
export const InputType = {
    Keyboard: 0,
} as const;

export type InputType = (typeof InputType)[keyof typeof InputType];
export class Input {
    private _currentInputType: InputType;
    private events: Event<InputEvent>;
    private keyboard: Keyboard;
    constructor() {
        this._currentInputType = InputType.Keyboard;
        this.events = new Event();
        this.keyboard = new Keyboard();
        this.keyboard.keyEvent.listen((action) => {
            this.events.publish({
                inputType: InputType.Keyboard,
                action,
            });
        });
    }
    dispose() {
        this.keyboard.dispose();
    }
    get onInput(): EventListener<InputEvent> {
        return this.events;
    }
    get currentInputType(): InputType {
        return this._currentInputType;
    }
}
