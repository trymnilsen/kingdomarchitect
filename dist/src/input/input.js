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
import { Keyboard } from "./keyboard.js";
import { Event } from "../common/event.js";
export var InputType;
(function(InputType) {
    InputType[InputType["Keyboard"] = 0] = "Keyboard";
})(InputType || (InputType = {}));
export class Input {
    dispose() {
        this.keyboard.dispose();
    }
    get onInput() {
        return this.events;
    }
    get currentInputType() {
        return this._currentInputType;
    }
    constructor(){
        _define_property(this, "_currentInputType", void 0);
        _define_property(this, "events", void 0);
        _define_property(this, "keyboard", void 0);
        this._currentInputType = InputType.Keyboard;
        this.events = new Event();
        this.keyboard = new Keyboard();
        this.keyboard.keyEvent.listen((action)=>{
            this.events.publish({
                inputType: InputType.Keyboard,
                action
            });
        });
    }
}
