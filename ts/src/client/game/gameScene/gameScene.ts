export interface GameScene {
    transitionTo(): void;
    transitionFrom(): void;
    render(): void;
    dispose(): void;
}

export interface GameSceneChanger {
    transition(toName: string): void;
}
export class GameSceneHandler implements GameSceneChanger {
    private scenes: { [name: string]: GameScene } = {};
    private currentScene: GameScene;

    public constructor() {}

    public registerScene(name: string, scene: GameScene) {
        this.scenes[name] = scene;
    }

    public transition(toName: string) {
        const newScene = this.scenes[toName];
        if (!newScene) {
            throw new Error("Invalid scene name, cannot transition");
        }
        if (!!this.currentScene) {
            this.currentScene.transitionFrom();
        }
        newScene.transitionTo();
        this.currentScene = newScene;
    }

    public disposeAllScenes(): void {
        Object.values(this.scenes).forEach((scene) => scene.dispose());
    }

    public get currentGameScene(): GameScene {
        return this.currentGameScene;
    }
}
