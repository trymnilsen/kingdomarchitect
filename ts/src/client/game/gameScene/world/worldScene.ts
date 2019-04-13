import { ChunkHandler, Chunk } from "./chunk";
import { GameScene } from "../gameScene";
import { RenderContext } from "../../rendering/renderContext";
import { RenderNode } from "../../rendering/items/renderNode";
import { Input } from "../../../input/input";

export const WorldSceneName = "world";
export class WorldScene implements GameScene {
    private chunks: ChunkHandler;
    public constructor(rootNode: RenderNode) {
        this.chunks = new ChunkHandler(rootNode);
    }
    transitionTo(): void {}
    render(context: RenderContext): void {
        this.chunks.render(context);
    }
    dispose(): void {}
}
