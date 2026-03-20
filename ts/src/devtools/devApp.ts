import { createLogger } from "../common/logging/logger.ts";
import { AssetLoader } from "../asset/loader/assetLoader.ts";
import { Camera } from "../rendering/camera.ts";
import { Renderer } from "../rendering/renderer.ts";
import { Entity } from "../game/entity/entity.ts";
import { UiRenderer, type UIEvent } from "../ui/declarative/ui.ts";
import { TouchInput } from "../input/touchInput.ts";
import { DrawMode } from "../rendering/drawMode.ts";
import { renderSystem } from "../game/system/renderSystem.ts";
import type { ComponentDescriptor } from "../ui/declarative/ui.ts";
import type { Point } from "../common/point.ts";

const log = createLogger("devapp");

/**
 * Base class for development and preview applications.
 * Handles canvas setup, asset loading, camera, renderer, UI renderer,
 * touch input, and a demand-driven render loop.
 *
 * Subclasses override buildUI(), getScene(), and onTick() to provide
 * their specific content.
 */
export class DevApp {
    protected renderer: Renderer;
    protected assetLoader: AssetLoader;
    protected camera: Camera;
    protected uiRenderer: UiRenderer;
    protected touchInput: TouchInput;
    protected drawTick: number = 0;

    constructor(canvasElementId: string) {
        this.assetLoader = new AssetLoader();
        this.camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });
        this.camera.position = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        };

        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${canvasElementId}`,
        );

        if (canvasElement == null) {
            throw new Error(`Canvas element #${canvasElementId} not found`);
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
        log.info("Dev app bootstrapping");
        this.assetLoader.load();
        await this.assetLoader.loaderPromise;
        log.info("Dev app assets loaded");
        this.render();
    }

    /**
     * Override to provide the root UI component descriptor each frame.
     * Return null to render no UI.
     */
    protected buildUI(): ComponentDescriptor | null {
        return null;
    }

    /**
     * Override to provide the root entity tree to render each frame.
     * Return null to skip scene rendering.
     */
    protected getScene(): Entity | null {
        return null;
    }

    /**
     * Override to perform per-frame logic (e.g. animation tick increments).
     */
    protected onTick(): void {}

    protected render() {
        this.renderer.clearScreen();

        const scene = this.getScene();
        if (scene != null) {
            renderSystem.onRender?.(
                scene,
                this.drawTick,
                this.renderer.context,
                DrawMode.Tick,
            );
        }

        this.uiRenderer.renderComponent(this.buildUI());
        this.renderer.renderDeferred();
    }

    private setupInputListeners() {
        this.touchInput.onTapDown = (position: Point) => {
            const uiEvent: UIEvent = {
                type: "tapDown",
                position,
                timestamp: Date.now(),
            };
            const handled = this.uiRenderer.dispatchUIEvent(uiEvent);
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
            this.render();
        };
    }
}
