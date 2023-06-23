import { InputAction } from "./inputAction.js";
import { Keyboard } from "./keyboard.js";
import { Event, EventListener } from "../common/event.js";

export interface InputEvent {
    action: InputAction;
    inputType: InputType;
}
export enum InputType {
    Keyboard,
}
export class Input {
    private _currentInputType: InputType;
    private events: Event<InputEvent>;
    private keyboard: Keyboard;
    public constructor() {
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
    public dispose() {
        this.keyboard.dispose();
    }
    public get onInput(): EventListener<InputEvent> {
        return this.events;
    }
    public get currentInputType(): InputType {
        return this._currentInputType;
    }
}
