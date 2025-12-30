import { AssetLoader } from "../asset/loader/assetLoader.ts";
import { Camera } from "../rendering/camera.ts";
import { Renderer } from "../rendering/renderer.ts";
import { Entity } from "../game/entity/entity.ts";
import { sprites2 } from "../asset/sprite.ts";
import { UiRenderer, type UIEvent } from "../ui/declarative/ui.ts";
import { TouchInput } from "../input/touchInput.ts";
import type { Point } from "../common/point.ts";
import { CharacterBuilderUI } from "./characterBuilderUI.ts";

/**
 * Main CharacterBuilder class
 * Manages rendering, input, and the render loop for the character builder application
 */
export class CharacterBuilder {
    private renderer: Renderer;
    private assetLoader: AssetLoader;
    private camera: Camera;
    private uiRenderer: UiRenderer;
    private touchInput: TouchInput;
    private drawTick = 0;
    private dummyScene: Entity;
    private canvasElementId: string;

    constructor(canvasElementId: string) {
        this.canvasElementId = canvasElementId;
        this.assetLoader = new AssetLoader();
        this.dummyScene = new Entity("characterBuilderScene");
        this.camera = new Camera(
            {
                x: window.innerWidth,
                y: window.innerHeight,
            },
            this.dummyScene,
        );
        this.camera.position = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        };

        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${this.canvasElementId}`,
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }

        this.renderer = new Renderer(
            canvasElement,
            this.assetLoader,
            this.camera,
        );

        this.uiRenderer = new UiRenderer(this.renderer.context);
        this.touchInput = new TouchInput(canvasElement);
        this.setupInputListeners();
    }

    async bootstrap(): Promise<void> {
        console.log("Character builder bootstrapping");
        this.assetLoader.load();

        await this.assetLoader.loaderPromise;
        console.log("Character builder assets loaded");

        // Start render loop
        //setInterval(() => this.onTick(), 200);
        this.render();
    }

    private setupInputListeners() {
        this.touchInput.onTapDown = (position: Point) => {
            const uiEvent: UIEvent = {
                type: "tapDown",
                position,
                timestamp: Date.now(),
            };
            const handled = this.uiRenderer.dispatchUIEvent(uiEvent);
            // Render to show button press state
            this.render();
            return handled;
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            if (!tapEndEvent.wasDragging) {
                const uiEvent: UIEvent = {
                    type: "tap",
                    position: tapEndEvent.position,
                    startPosition: tapEndEvent.startPosition,
                    timestamp: Date.now(),
                };
                this.uiRenderer.dispatchUIEvent(uiEvent);
            }

            const upEvent: UIEvent = {
                type: "tapUp",
                position: tapEndEvent.position,
                timestamp: Date.now(),
            };
            this.uiRenderer.dispatchUIEvent(upEvent);
            // Render to update UI after state changes from button taps
            this.render();
        };
    }

    private onTick = () => {
        this.drawTick += 1;
        this.renderer.context.drawTick = this.drawTick;
        //this.render();
    };

    private render() {
        this.renderer.clearScreen();

        // Render the UI
        this.uiRenderer.renderComponent(CharacterBuilderUI());

        this.renderer.renderDeferred();
    }
}
