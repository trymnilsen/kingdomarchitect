import type { ComponentDescriptor } from "../ui/declarative/ui.ts";
import { DevApp } from "../devtools/devApp.ts";
import { CharacterBuilderUI } from "./characterBuilderUI.ts";

/**
 * Character builder dev app.
 * Renders the character customization UI using the shared DevApp scaffold.
 */
export class CharacterBuilder extends DevApp {
    constructor(canvasElementId: string) {
        super(canvasElementId);
    }

    protected override buildUI(): ComponentDescriptor | null {
        return CharacterBuilderUI();
    }
}
