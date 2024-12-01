import { AssetLoader } from "../asset/loader/assetLoader.js";
import { Point } from "../common/point.js";
import { GameTime } from "../common/time.js";
import { createHealEffect } from "../data/effect/health/healEffect.js";
import {
    EcsInitEvent,
    EcsInputEvent,
    EcsRenderEvent,
    EcsUpdateEvent,
} from "../ecs/ecsEvent.js";
import { EcsWorld } from "../ecs/ecsWorld.js";
import { Input } from "../input/input.js";
import { TouchInput } from "../input/touchInput.js";
import { DrawMode } from "../rendering/drawMode.js";
import { Renderer } from "../rendering/renderer.js";
import { Entity } from "./entity/entity.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { createAggroSystem } from "./system/aggroSystem.js";
import { createBattleQueueSystem } from "./system/battleQueueSystem.js";
import { createBuildingSystem } from "./system/buildingSystem.js";
import { createCraftingSystem } from "./system/craftingSystem.js";
import { createEffectSystem } from "./system/effectSystem.js";
import { createHealthQueueSystem } from "./system/healthQueueSystem.js";
import { createHousingSystem } from "./system/housingSystem.js";
import { createJobSystem } from "./system/jobSystem.js";
import { createRenderSystem } from "./system/renderSystem.js";
import { createResourceSystem } from "./system/resourceSystem.js";
import { createTileRenderSystem } from "./system/tileRendererSystem.js";
import { createUiSystem } from "./system/uiSystem.js";
import { createVisibilitySystem } from "./system/visiblitySystem.js";
import { createWorldGenerationSystem } from "./system/worldGenerationSystem.js";

export class Game2 {
    private renderer: Renderer;
    private world: EcsWorld;
    private assetLoader: AssetLoader;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;
    private drawTick = 0;
    private updateTick = 0;
    private gameTime: GameTime = new GameTime();

    constructor(domElementWrapperSelector: string) {
        // Get the canvas
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`,
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);

        this.world = new EcsWorld();
        // UI states handling
        this.interactionHandler = new InteractionHandler(
            new Entity("foo"),
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
            () => {},
        );
    }

    async bootstrap(): Promise<void> {
        console.log("Bootstrap game");
        const loaderPromise = this.assetLoader.load();
        this.setupSystems();
        this.setupInput();
        await loaderPromise;
        console.log("Bootstrap game finished");
        this.world.dispatchEvent(new EcsInitEvent());
        setInterval(this.onTick.bind(this), 200);
        this.render(DrawMode.Gesture);
    }

    private onTick() {
        this.drawTick += 1;
        if (this.drawTick % 5 == 0) {
            this.updateTick += 1;
            this.world.dispatchEvent(new EcsUpdateEvent());
            //this.interactionHandler.onUpdate(this.updateTick);
        }

        this.render(DrawMode.Tick);
    }

    private setupSystems() {
        this.world.addSystem(createWorldGenerationSystem());
        this.world.addSystem(createAggroSystem());
        this.world.addSystem(createBattleQueueSystem());
        this.world.addSystem(createCraftingSystem());
        this.world.addSystem(createEffectSystem());
        this.world.addSystem(createHealthQueueSystem());
        this.world.addSystem(createHousingSystem());
        this.world.addSystem(createJobSystem());
        this.world.addSystem(createBuildingSystem());
        this.world.addSystem(createTileRenderSystem());
        this.world.addSystem(createRenderSystem());
        this.world.addSystem(createResourceSystem());
        this.world.addSystem(
            createUiSystem(this.interactionHandler, this.renderer.camera),
        );
        this.world.addSystem(createVisibilitySystem());
    }

    private setupInput() {
        this.touchInput.onTapDown = (position: Point) => {
            const event = new EcsInputEvent({
                id: "tap-down",
                position: position,
            });
            this.world.dispatchEvent(event);
            this.render(DrawMode.Gesture);
            return event.handled;
        };

        this.touchInput.onPan = (
            movement: Point,
            position: Point,
            startPosition: Point,
            downTapHandled: boolean,
        ) => {
            this.world.dispatchEvent(
                new EcsInputEvent({
                    id: "pan",
                    movement,
                    position,
                    startPosition,
                    downTapHandled,
                }),
            );
            this.render(DrawMode.Gesture);
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            //this.interactionHandler.onTapUp(tapEndEvent);
            this.world.dispatchEvent(
                new EcsInputEvent({
                    id: "tap-end",
                    position: tapEndEvent.position,
                    startPosition: tapEndEvent.startPosition,
                    wasDragging: tapEndEvent.wasDragging,
                }),
            );
            this.render(DrawMode.Gesture);
        };

        this.input.onInput.listen((inputEvent) => {
            this.world.dispatchEvent(
                new EcsInputEvent({ id: "action", action: inputEvent.action }),
            );
        });
    }

    private render(drawMode: DrawMode) {
        this.renderer.clearScreen();
        this.world.dispatchEvent(
            new EcsRenderEvent(this.renderer.context, drawMode),
        );
    }
}
