import { GameScene } from "./gameScene";
import { Renderer } from "../rendering/renderer";
import { InputEvent } from "../../input/input";
import { Camera } from "../rendering/camera";
import { RenderNode, container } from "../rendering/items/renderNode";
import { GameState } from "../state/gameState";
import { PlayerEntity } from "../entity/playerEntity";
import { InputActionName, InputActionData } from "../../input/inputAction";
import { playerVisual } from "../visual/player";
import { rectangle } from "../rendering/items/rectangle";
import { Dispatcher } from "../state/dispatcher";
import { movePlayerAction } from "../state/action/player/movePlayerAction";
import { Direction } from "../../data/direction";
import { Point } from "../../data/point";

export class MainScene implements GameScene {
    private dispatcher: Dispatcher;

    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }

    onInput(inputEvent: InputEvent): void {
        //throw new Error("Method not implemented.");
        switch (inputEvent.action) {
            case InputActionData.LEFT_PRESS:
                this.dispatcher.dispatch(movePlayerAction(Direction.Left));
                break;
            case InputActionData.RIGHT_PRESS:
                this.dispatcher.dispatch(movePlayerAction(Direction.Right));
                break;
            case InputActionData.UP_PRESS:
                this.dispatcher.dispatch(movePlayerAction(Direction.Up));
                break;
            case InputActionData.DOWN_PRESS:
                this.dispatcher.dispatch(movePlayerAction(Direction.Down));
                break;
        }
    }

    onRender(gameState: GameState, camera: Camera): RenderNode {
        const world = container();
        world.children.push(this.renderTiles());
        world.children.push(this.renderPlayer(gameState.playerState.position));
        return world;
    }

    private renderPlayer(playerPosition: Point): RenderNode {
        const visual = playerVisual();
        visual.config.x = playerPosition.x * 32;
        visual.config.y = playerPosition.y * 32;
        return visual;
    }

    private renderTiles(): RenderNode {
        const tileContainer = container();
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                tileContainer.children.push(
                    rectangle({
                        x: x * 32 + 2,
                        y: y * 32 + 2,
                        width: 28,
                        height: 28,
                        fill: "#1ac92f",
                    })
                );
            }
        }
        return tileContainer;
    }
}
