import { WorldScene, WorldSceneName } from "./gameScene/world/worldScene";
import { GameSceneHandler } from "./gameScene/gameScene";
import { Renderer } from "./rendering/renderer";
import { Input } from "../input/input";
import { Simulation } from "../../common/simulation/simulation";
import { NetworkSimulation } from "../../common/simulation/networkSimulation";

export class Game {
    private sceneHandler: GameSceneHandler;
    private renderer: Renderer;
    private input: Input;
    private simulation: Simulation;
    public constructor(wrapper: string) {
        this.input = new Input();
        this.simulation = new NetworkSimulation();
        this.input.onInput.listen((event) => {
            this.simulation.dispatchEvent({
                source: "localplayer"
            });
        });
        this.renderer = new Renderer(wrapper);
        this.sceneHandler = new GameSceneHandler();
        //Scenes
        this.sceneHandler.registerScene(
            WorldSceneName,
            new WorldScene(this.renderer.rootNode)
        );
        this.sceneHandler.transition(WorldSceneName);
        //TODO: Setup input
        this.renderer.render();
    }

    public render(): void {
        this.sceneHandler.currentGameScene.render(this.renderer.context);
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
    }
}
