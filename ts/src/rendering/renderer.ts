import { AssetLoader } from "../asset/assetLoader";
import { rgbToHex } from "../common/color";
import { Camera } from "./camera";
import { RenderContext } from "./renderContext";

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private currentCamera: Camera;
    private renderContext: RenderContext;

    public get camera(): Camera {
        return this.currentCamera;
    }

    public get context(): RenderContext {
        return this.renderContext;
    }

    constructor(canvasElement: HTMLCanvasElement, assetLoader: AssetLoader) {
        const context = canvasElement.getContext("2d");
        if (!context) {
            throw Error("Unable to get 2d context from canvas");
        }
        this.currentCamera = new Camera();
        this.canvasContext = context;
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.canvasContext.imageSmoothingEnabled = false;
        this.renderContext = new RenderContext(
            context,
            this.camera,
            assetLoader,
            window.innerWidth,
            window.innerHeight
        );
    }

    clearScreen() {
        this.canvasContext.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
        this.canvasContext.fillStyle = rgbToHex(40, 40, 40);
        this.canvasContext.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
    }
}
