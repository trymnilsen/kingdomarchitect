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
import { GameState } from "./state/gameState";
import { Dispatcher } from "./state/dispatcher";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private scene: GameScene;
    private state: GameState;
    private dispatcher: Dispatcher;
    private cameraPosition: Point = {
        x: 0,
        y: 0,
    };
    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        this.state = new GameState();
        this.dispatcher = new Dispatcher(this.state, () => {
            this.render();
        });
        this.scene = new MainScene(this.dispatcher);

        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            this.scene.onInput(inputEvent);
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
        const nodes = this.scene.onRender(this.state, this.renderer.camera);
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
