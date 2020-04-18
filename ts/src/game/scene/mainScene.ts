import { GameScene } from "./gameScene";
import { Renderer } from "../rendering/renderer";
import { InputEvent } from "../../input/input";
import { Camera } from "../rendering/camera";
import { RenderNode } from "../rendering/items/renderNode";
import { GameState } from "../gameState";
import { PlayerEntity } from "../entity/playerEntity";
import { InputActionName, InputActionData } from "../../input/inputAction";
import { playerVisual } from "../visual/player";

export class MainScene implements GameScene {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    onInput(inputEvent: InputEvent): void {
        //throw new Error("Method not implemented.");
        switch(inputEvent) {
            case InputActionData.LEFT_PRESS:
                this.player.
        }
    }

    onRender(camera: Camera): RenderNode {
        return playerVisual();
    }
}
