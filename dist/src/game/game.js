function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { AssetLoader } from "../asset/loader/assetLoader.js";
import { changeX, changeY, invert } from "../common/point.js";
import { MutableGameTime } from "../common/time.js";
import { Input } from "../input/input.js";
import { InputActionType } from "../input/inputAction.js";
import { TouchInput } from "../input/touchInput.js";
import { Renderer } from "../rendering/renderer.js";
import { MainScene } from "./mainScene.js";
import { TileSize } from "./world/tile/tile.js";
export class Game {
    async bootstrap() {
        await this.assetLoader.load();
        this.touchInput.onTapDown = (position)=>{
            const tapResult = this.currentScene.onTapDown(position);
            this.render();
            return tapResult;
        };
        /*
        this.touchInput.onTapUp = (position: Point) => {
            this.currentScene.onTapUp(position);
            this.render();
        };*/ this.touchInput.onPan = (movement, position, startPosition, downTapHandled)=>{
            if (downTapHandled) {
                this.currentScene.onTapPan(movement, position, startPosition);
            } else {
                this.renderer.camera.translate(invert(movement));
            }
            this.render();
        };
        this.touchInput.onTapEnd = (tapEndEvent)=>{
            this.currentScene.onTapUp(tapEndEvent);
            this.render();
        };
        this.input.onInput.listen((inputEvent)=>{
            this.onInput(inputEvent);
        });
        setInterval(this.onTick, 1000);
        this.updateCamera({
            x: TileSize * 5,
            y: TileSize * 5
        });
        this.render();
    }
    updateCamera(newPosition) {
        this.renderer.camera.position = newPosition;
        this.render();
    }
    onInput(inputEvent) {
        console.log("Input: ", inputEvent);
        if (inputEvent.action.isShifted) {
            switch(inputEvent.action.action){
                case InputActionType.ACTION_PRESS:
                    this.currentScene.input(inputEvent.action);
                    break;
                case InputActionType.UP_PRESS:
                    this.updateCamera(changeY(this.renderer.camera.position, -TileSize));
                    break;
                case InputActionType.DOWN_PRESS:
                    this.updateCamera(changeY(this.renderer.camera.position, TileSize));
                    break;
                case InputActionType.LEFT_PRESS:
                    this.updateCamera(changeX(this.renderer.camera.position, -TileSize));
                    break;
                case InputActionType.RIGHT_PRESS:
                    this.updateCamera(changeX(this.renderer.camera.position, TileSize));
                    break;
            }
        } else {
            this.currentScene.input(inputEvent.action);
        }
        this.render();
    }
    render() {
        //const renderStart = performance.now();
        this.renderer.clearScreen();
        this.currentScene.drawScene(this.renderer.context);
    //const renderEnd = performance.now();
    //console.log("⏱render time: ", renderEnd - renderStart);
    }
    constructor(domElementWrapperSelector){
        _define_property(this, "renderer", void 0);
        _define_property(this, "input", void 0);
        _define_property(this, "currentScene", void 0);
        _define_property(this, "touchInput", void 0);
        _define_property(this, "assetLoader", void 0);
        _define_property(this, "gameTime", void 0);
        _define_property(this, "currentTick", 0);
        _define_property(this, "onTick", ()=>{
            this.currentTick += 1;
            this.gameTime.updateTick(this.currentTick);
            this.currentScene.tick(this.currentTick);
            this.render();
        });
        // Get the canvas
        const canvasElement = document.querySelector(`#${domElementWrapperSelector}`);
        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }
        this.gameTime = new MutableGameTime();
        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);
        // Rendering and scenes
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader, this.gameTime);
        this.currentScene = new MainScene(this.renderer.camera, this.assetLoader, this.gameTime);
    }
}
