import { changeX, changeY, Point } from "../data/point";
import { Input, InputEvent, InputType } from "../input/input";
import { InputActionData } from "../input/inputAction";
import {
    CAMERA_DOWN_HIT_TAG,
    CAMERA_LEFT_HIT_TAG,
    CAMERA_RIGHT_HIT_TAG,
    CAMERA_UP_HIT_TAG,
    NUMBER_OF_CHUNKS,
    TILES_PER_CHUNK,
} from "./constants";
import { Renderer } from "./rendering/renderer";
import { GameScene } from "./scene/gameScene";
import { MainScene } from "./scene/mainScene";
import { toggleWall } from "./state/chunkHandler";
import { ChunkMap, GameState, getChunkId } from "./state/gameState";
import { getUi } from "./ui/uiPresenter";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private scene: GameScene;
    private state: GameState;
    private cameraPosition: Point = {
        x: 4,
        y: 4,
    };
    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        this.state = getInitalGameState();
        this.scene = new MainScene();

        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });

        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        canvasElement.addEventListener("click", (mouseEvent) => {
            this.onClick(mouseEvent.clientX, mouseEvent.clientY);
        });

        this.renderer = new Renderer(canvasElement);
        this.renderer.camera.center(this.cameraPosition);
        this.render();
    }

    private onInput(inputEvent: InputEvent) {
        switch (inputEvent.action) {
            case InputActionData.UP_PRESS:
                this.updateCamera(changeY(this.cameraPosition, -1));
                break;
            case InputActionData.DOWN_PRESS:
                this.updateCamera(changeY(this.cameraPosition, 1));
                break;
            case InputActionData.LEFT_PRESS:
                this.updateCamera(changeX(this.cameraPosition, -1));
                break;
            case InputActionData.RIGHT_PRESS:
                this.updateCamera(changeX(this.cameraPosition, 1));
                break;
        }
    }

    private updateCamera(newPosition: Point) {
        console.log("Update camera:", newPosition);
        this.cameraPosition = newPosition;
        this.renderer.camera.center(newPosition);
        this.render();
    }

    private onClick(x: number, y: number) {
        const hit = this.renderer.queryRenderItem({
            x,
            y,
        });
        if (hit) {
            console.log("Clicked on: ", hit.config.hitTag);
            switch (hit.config.hitTag) {
                case CAMERA_UP_HIT_TAG:
                    this.updateCamera(changeY(this.cameraPosition, -1));
                    break;
                case CAMERA_DOWN_HIT_TAG:
                    this.updateCamera(changeY(this.cameraPosition, 1));
                    break;
                case CAMERA_LEFT_HIT_TAG:
                    this.updateCamera(changeX(this.cameraPosition, -1));
                    break;
                case CAMERA_RIGHT_HIT_TAG:
                    this.updateCamera(changeX(this.cameraPosition, 1));
                    break;
            }
        } else {
            const transformedPosition = this.renderer.camera.screenToWorldSpace(
                {
                    x,
                    y,
                }
            );
            toggleWall(this.state, transformedPosition);
            this.render();
            console.log("Cliked at: ", transformedPosition);
        }
    }

    private render() {
        const getRenderNodesStart = performance.now();
        const gameNode = this.scene.onRender(this.state, this.renderer.camera);
        const uiNode = getUi(this.state);
        const getRenderNodesEnd = performance.now();
        console.log(
            "⏱get RenderNodes: ",
            getRenderNodesEnd - getRenderNodesStart
        );
        const renderStart = performance.now();
        this.renderer.render(gameNode, uiNode);
        const renderEnd = performance.now();
        console.log("⏱render time: ", renderEnd - renderStart);
    }

    public dispose(): any {}
}

function getInitalGameState(): GameState {
    const chunks: ChunkMap = {};
    for (let x = 0; x < NUMBER_OF_CHUNKS; x++) {
        for (let y = 0; y < NUMBER_OF_CHUNKS; y++) {
            const tileMap: number[] = [];
            const roomMap: number[] = [];
            const position = { x, y };

            for (let tileX = 0; tileX < TILES_PER_CHUNK; tileX++) {
                for (let tileY = 0; tileY < TILES_PER_CHUNK; tileY++) {
                    tileMap.push(0);
                    roomMap.push(1);
                }
            }

            chunks[getChunkId(position)] = {
                position,
                roomMap,
                tileMap,
            };
        }
    }
    return {
        chunks,
    };
}
