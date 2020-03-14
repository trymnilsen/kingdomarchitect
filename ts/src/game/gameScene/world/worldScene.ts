import { GameScene } from "../gameScene";
import { RenderContext } from "../../rendering/renderContext";
import { RenderNode, container } from "../../rendering/items/renderNode";
import { Input } from "../../../input/input";
import { JsonNode } from "../../../state/jsonNode";
import { DataTree } from "../../../state/dataNode";
import { rectangle } from "../../rendering/items/rectangle";
import { renderPlayer } from "./player";
import { renderChunks } from "./chunk";

export const WorldSceneName = "world";
export class WorldScene implements GameScene {
    transitionTo(): void {}
    render(state: DataTree): RenderNode {
        const rootNode = container({ x: 0, y: 0 });
        rootNode.children.push(renderPlayer(state));
        rootNode.children.push(renderChunks(state));
        return rootNode;
    }
    dispose(): void {}
}
