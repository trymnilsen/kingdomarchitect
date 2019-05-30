import { ChunkHandler, Chunk } from "./chunk";
import { GameScene } from "../gameScene";
import { RenderContext } from "../../rendering/renderContext";
import { RenderNode } from "../../rendering/items/renderNode";
import { Input } from "../../../input/input";
import { JsonNode } from "../../../state/jsonNode";
import { Player } from "./player";
import { DataTree } from "../../../state/dataNode";

export const WorldSceneName = "world";
export class WorldScene implements GameScene {
    private chunks: ChunkHandler;
    private state: DataTree;
    private player: Player;
    public constructor(rootNode: RenderNode, state: DataTree) {
        this.chunks = new ChunkHandler(rootNode);
        this.player = new Player(rootNode, state.get("player"));
    }
    transitionTo(): void {}
    render(context: RenderContext): void {
        this.chunks.render(context);
    }
    dispose(): void {}
}
