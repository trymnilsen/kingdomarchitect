import { ChunkHandler, Chunk } from "../chunk";
import { GameScene } from "./gameScene";

export const WorldSceneName = "world";
export class WorldScene implements GameScene {
    private chunks: ChunkHandler;
    public constructor() {
        this.chunks = new ChunkHandler();
    }
    transitionTo(): void {}
    transitionFrom(): void {}
    render(): void {}
    dispose(): void {}
}
