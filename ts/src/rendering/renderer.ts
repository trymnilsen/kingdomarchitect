import { AssetLoader } from "../asset/loader/assetLoader.js";
import { rgbToHex } from "../common/color.js";
import { GameTime } from "../common/time.js";
import { Camera } from "./camera.js";
import { RenderScope } from "./renderContext.js";

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private currentCamera: Camera;
    private renderContext: RenderScope;

    get camera(): Camera {
        return this.currentCamera;
    }

    get context(): RenderScope {
        return this.renderContext;
    }

    constructor(canvasElement: HTMLCanvasElement, assetLoader: AssetLoader) {
        const context = canvasElement.getContext("2d");
        if (!context) {
            throw Error("Unable to get 2d context from canvas");
        }
        this.currentCamera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });
        this.canvasContext = context;
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.canvasContext.imageSmoothingEnabled = false;
        this.renderContext = new RenderScope(
            context,
            this.camera,
            assetLoader,
            window.innerWidth,
            window.innerHeight,
        );

        /*
    window.addEventListener("resize", () => {
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.renderContext.updateSize(
            window.innerWidth,
            window.innerHeight
        );
    });*/
    }

    renderDeferred() {
        const functions = this.context.getDeferredDrawFunctions();
        for (const drawFunction of functions) {
            drawFunction(this.renderContext);
        }
        this.renderContext.clearDeferredDrawFunctions();
    }

    clearScreen() {
        let clearColor = dayClearColor;
        this.canvasContext.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight,
        );
        this.canvasContext.fillStyle = clearColor;
        this.canvasContext.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight,
        );
    }
}

const dayClearColor = rgbToHex(0, 50, 20);
const nightClearColor = rgbToHex(30, 0, 50);
