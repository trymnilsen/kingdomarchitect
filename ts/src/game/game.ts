import { WorldScene, WorldSceneName } from "./gameScene/world/worldScene";
import { GameSceneHandler } from "./gameScene/gameScene";
import { Renderer } from "./rendering/renderer";
import { Input } from "../input/input";

export class Game {
    private sceneHandler: GameSceneHandler;
    private renderer: Renderer;
    private input: Input;

    public constructor(domElementWrapperSelector: string) {
        this.input = new Input();

        //Input
        this.input.onInput.listen((inputEvent) => {});
        this.renderer = new Renderer(domElementWrapperSelector);
        this.sceneHandler = new GameSceneHandler();

        this.sceneHandler.registerScene(
            WorldSceneName,
            new WorldScene(this.renderer.rootNode)
        );
        this.sceneHandler.transition(WorldSceneName);
        //TODO: Setup input
        this.renderer.render();
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
    }
}
