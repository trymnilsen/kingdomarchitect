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
import { rgbToHex } from "../common/color.js";
import { Camera } from "./camera.js";
import { RenderContext } from "./renderContext.js";
export class Renderer {
    get camera() {
        return this.currentCamera;
    }
    get context() {
        return this.renderContext;
    }
    clearScreen() {
        let clearColor = dayClearColor;
        if (this.gameTime.fractionalTimeOfDay >= 0.75) {
            clearColor = nightClearColor;
        }
        this.canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.canvasContext.fillStyle = clearColor;
        this.canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    constructor(canvasElement, assetLoader, gameTime){
        _define_property(this, "canvasContext", void 0);
        _define_property(this, "currentCamera", void 0);
        _define_property(this, "renderContext", void 0);
        _define_property(this, "gameTime", void 0);
        const context = canvasElement.getContext("2d");
        if (!context) {
            throw Error("Unable to get 2d context from canvas");
        }
        this.currentCamera = new Camera();
        this.canvasContext = context;
        this.gameTime = gameTime;
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.canvasContext.imageSmoothingEnabled = false;
        this.renderContext = new RenderContext(context, this.camera, assetLoader, window.innerWidth, window.innerHeight);
    /*
        window.addEventListener("resize", () => {
            this.canvasContext.canvas.width = window.innerWidth;
            this.canvasContext.canvas.height = window.innerHeight;
            this.renderContext.updateSize(
                window.innerWidth,
                window.innerHeight
            );
        });*/ }
}
const dayClearColor = rgbToHex(0, 50, 20);
const nightClearColor = rgbToHex(30, 0, 50);
