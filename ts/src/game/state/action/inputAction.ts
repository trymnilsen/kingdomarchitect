import { InputEvent } from "../../../input/input";

export const INPUT_ACTION_NAME = "input/button_pressed";

export function inputAction(event: InputEvent) {
    return {
        name: INPUT_ACTION_NAME,
        data: event,
    };
}
