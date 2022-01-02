import { InputAction } from "../input/inputAction";
import { RenderContext } from "../rendering/renderContext";
import { SceneNode } from "./sceneNode";

export interface Scene {
    drawScene(context: RenderContext): void;
    input(action: InputAction): void;
}
