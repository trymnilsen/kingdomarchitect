import { WorldScene, WorldSceneName } from "./gameScene/worldScene";
import { GameSceneHandler } from "./gameScene/gameScene";

export class Game {
    private sceneHandler: GameSceneHandler;
    public constructor(wrapper: string) {
        this.sceneHandler = new GameSceneHandler();
        //Scenes
        this.sceneHandler.registerScene(WorldSceneName, new WorldScene());
        this.sceneHandler.transition(WorldSceneName);
        //Chunks
        //Entities
        //Input
        //HUD
        //Quickbar
        //Dialogs
        //Messages
        //Toast
    }

    public render(): void {
        this.sceneHandler.currentGameScene.render();
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
    }
}
