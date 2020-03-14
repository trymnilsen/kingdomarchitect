"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keyboard_1 = require("./keyboard");
const event_1 = require("../event/event");
var InputType;
(function (InputType) {
    InputType[InputType["Keyboard"] = 0] = "Keyboard";
})(InputType = exports.InputType || (exports.InputType = {}));
class Input {
    constructor() {
        this.events = new event_1.Event();
        this.keyboard = new keyboard_1.Keyboard();
        this.keyboard.keyEvent.listen((action) => {
            this.events.publish({
                inputType: InputType.Keyboard,
                action
            });
        });
    }
    dispose() {
        this.keyboard.dispose();
    }
    get onInput() {
        return this.events;
    }
    get currentInputType() {
        return this._currentInputType;
    }
}
exports.Input = Input;
function InputEventToAction(inputEvent) {
    return {
        name: ["input"],
        data: inputEvent.action
    };
}
exports.InputEventToAction = InputEventToAction;
//# sourceMappingURL=input.js.map