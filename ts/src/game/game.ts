import { changeX, changeY, invert as invert, Point } from "../common/point";
import { TouchInput } from "../input/touchInput";
import { Input, InputEvent } from "../input/input";
import { InputAction } from "../input/inputAction";
import { Renderer } from "../rendering/renderer";
import { Scene } from "../scene/scene";
import { MainScene } from "./world/mainScene";
import { assets } from "../asset/assets";
import { AssetLoader } from "../asset/assetLoader";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private currentScene: Scene;
    private touchInput: TouchInput;
    private assetLoader: AssetLoader;
    private currentTick: number = 0;
    public constructor(domElementWrapperSelector: string) {
        // Input
        this.input = new Input();
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }
        this.touchInput = new TouchInput(canvasElement);
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);
        this.currentScene = new MainScene(this.renderer.camera);
    }

    async bootstrap(): Promise<void> {
        await this.assetLoader.load();
        this.touchInput.onPan.listen((onPanEvent) => {
            this.renderer.camera.translate(invert(onPanEvent.movement));
            this.render();
        });
        this.touchInput.onTap.listen((onTapEvent) => {
            const worldPosition =
                this.renderer.camera.screenToWorld(onTapEvent);
            console.log("Clicked at: ", worldPosition);
            this.currentScene.tap(worldPosition);
            this.render();
        });
        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });
        setInterval(this.onTick, 1000);
        this.render();
    }

    private onTick = () => {
        this.currentTick += 1;
        this.currentScene.tick(this.currentTick);
        this.render();
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render();
    }

    private onInput(inputEvent: InputEvent) {
        console.log("Input: ", inputEvent);
        switch (inputEvent.action) {
            case InputAction.ACTION_PRESS:
                this.currentScene.input(inputEvent.action);
                break;
            case InputAction.UP_PRESS:
                this.updateCamera(changeY(this.renderer.camera.position, -32));
                break;
            case InputAction.DOWN_PRESS:
                this.updateCamera(changeY(this.renderer.camera.position, 32));
                break;
            case InputAction.LEFT_PRESS:
                this.updateCamera(changeX(this.renderer.camera.position, -32));
                break;
            case InputAction.RIGHT_PRESS:
                this.updateCamera(changeX(this.renderer.camera.position, 32));
                break;
        }
        this.render();
    }

    private render() {
        const renderStart = performance.now();
        this.renderer.clearScreen();
        this.currentScene.drawScene(this.renderer.context);
        const renderEnd = performance.now();
        //console.log("⏱render time: ", renderEnd - renderStart);
    }

    public dispose(): any {}
}
