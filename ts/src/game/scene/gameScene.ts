import { Renderer } from "../rendering/renderer";
import { InputEvent } from "../../input/input";
import { Camera } from "../rendering/camera";
import { RenderNode } from "../rendering/items/renderNode";

export interface GameScene {
    onInput(inputEvent: InputEvent): void;
    onRender(camera: Camera): RenderNode;
}
