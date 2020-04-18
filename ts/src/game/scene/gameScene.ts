import { Renderer } from "../rendering/renderer";
import { InputEvent } from "../../input/input";
import { Camera } from "../rendering/camera";
import { RenderNode } from "../rendering/items/renderNode";
import { GameState } from "../state/gameState";

export interface GameScene {
    onInput(inputEvent: InputEvent): void;
    onRender(gameState: GameState, camera: Camera): RenderNode;
}
