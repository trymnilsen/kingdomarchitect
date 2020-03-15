import { InputActionData } from "./inputAction";
import { Keyboard } from "./keyboard";
import { Event, EventListener } from "../event/event";

export interface InputEvent {
    action: InputActionData;
    inputType: InputType;
}
export enum InputType {
    Keyboard
}
export class Input {
    private _currentInputType: InputType;
    private events: Event<InputEvent>;
    private keyboard: Keyboard;
    public constructor() {
        this.events = new Event();
        this.keyboard = new Keyboard();
        this.keyboard.keyEvent.listen((action) => {
            this.events.publish({
                inputType: InputType.Keyboard,
                action
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
