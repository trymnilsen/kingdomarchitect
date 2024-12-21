import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { EcsEvent } from "./ecsEvent.js";

export class EcsRenderEvent extends EcsEvent {
    constructor(
        public renderScope: RenderScope,
        private drawMode: DrawMode,
    ) {
        super();
    }
}
