import { changeX, changeY, Point } from "../data/point";
import { Input, InputEvent, InputType } from "../input/input";
import { InputActionData } from "../input/inputAction";
import { NUMBER_OF_CHUNKS, TILES_PER_CHUNK } from "./constants";
import { Renderer } from "./rendering/renderer";
import { ChunkMap, GameState, getChunkId } from "./state/gameState";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private state: GameState;
    private cameraPosition: Point = {
        x: 4,
        y: 4,
    };

    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        this.state = getInitalGameState();

        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });

        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        canvasElement.addEventListener("click", (mouseEvent) => {
            //On click
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

    private render() {
        const getRenderNodesStart = performance.now();
        //const gameNode = this.scene.onRender(this.state, this.renderer.camera)
        const getRenderNodesEnd = performance.now();
        console.log(
            "⏱get RenderNodes: ",
            getRenderNodesEnd - getRenderNodesStart
        );
        const renderStart = performance.now();
        //this.renderer.render(gameNode, uiNode);
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
                    roomMap.push(-1);
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
