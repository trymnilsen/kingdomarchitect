import { Renderer } from "./rendering/renderer";
import { Input, InputEvent } from "../input/input";
import { rectangle } from "./rendering/items/rectangle";
import { RenderNode, container } from "./rendering/items/renderNode";
import { Point, changeX, changeY } from "../data/point";
import { InputActionData } from "../input/inputAction";
import { rgbToHex } from "../util/color";
import { text } from "./rendering/items/text";
import { GameScene } from "./scene/gameScene";
import { MainScene } from "./scene/mainScene";
import { GameState } from "./gameState";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private scene: GameScene;
    private state: GameState;
    private cameraPosition: Point = {
        x: 0,
        y: 0,
    };
    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        this.scene = new MainScene(this.state);
        this.state = new GameState();

        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            this.scene.onInput(inputEvent);
        });

        this.state.stateUpdated.listen(() => {
            this.render();
        });

        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        this.renderer = new Renderer(canvasElement);
        this.renderer.camera.center(this.cameraPosition);
        //this.renderer.camera.follow(getPlayerPosition(this.state));
        this.render();
    }

    private render() {
        const getRenderNodesStart = performance.now();
        const nodes = this.scene.onRender(this.renderer.camera);
        const getRenderNodesEnd = performance.now();
        console.log(
            "Get RenderNodes: ",
            getRenderNodesEnd - getRenderNodesStart
        );
        const renderStart = performance.now();
        this.renderer.render(nodes);
        const renderEnd = performance.now();
        console.log("render time: ", renderEnd - renderStart);
    }

    public dispose(): any {}
}
