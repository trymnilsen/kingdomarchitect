import { AssetLoader } from "../asset/loader/assetLoader";
import { rgbToHex } from "../common/color";
import { GameTime } from "../common/time";
import { Camera } from "./camera";
import { RenderContext } from "./renderContext";

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private currentCamera: Camera;
    private renderContext: RenderContext;
    private gameTime: GameTime;

    public get camera(): Camera {
        return this.currentCamera;
    }

    public get context(): RenderContext {
        return this.renderContext;
    }

    constructor(
        canvasElement: HTMLCanvasElement,
        assetLoader: AssetLoader,
        gameTime: GameTime
    ) {
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
        this.renderContext = new RenderContext(
            context,
            this.camera,
            assetLoader,
            window.innerWidth,
            window.innerHeight
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

    clearScreen() {
        let clearColor = dayClearColor;
        if (this.gameTime.fractionalTimeOfDay >= 0.75) {
            clearColor = nightClearColor;
        }
        this.canvasContext.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
        this.canvasContext.fillStyle = clearColor;
        this.canvasContext.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
    }
}

const dayClearColor = rgbToHex(0, 50, 20);
const nightClearColor = rgbToHex(30, 0, 50);
