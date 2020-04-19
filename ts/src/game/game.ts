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
import { inputAction } from "./state/action/inputAction";
import { Action } from "./state/action/action";
import { getUi } from "./ui/uiPresenter";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private scene: GameScene;
    private state: GameState;
    private dispatcher: Dispatcher;
    private cameraPosition: Point = {
        x: 4,
        y: 4,
    };
    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        this.state = new GameState();
        this.dispatcher = new Dispatcher(this.state, () => {
            this.render();
        });
        this.scene = new MainScene();

        this.input.onInput.listen((inputEvent) => {
            this.dispatch(inputAction(inputEvent));
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

    private dispatch(action: Action<any>) {
        const dispatchStart = performance.now();
        this.dispatcher.dispatch(action);
        const dispatchEnd = performance.now();
        console.log("⏱[Total] update time: ", dispatchEnd - dispatchStart);
    }
}
