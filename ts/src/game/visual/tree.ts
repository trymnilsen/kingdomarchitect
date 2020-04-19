import { RenderNode } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";

export function treeVisual(): RenderNode {
    return rectangle({
        x: 8,
        y: 8,
        width: 16,
        height: 16,
        fill: "#2e1802",
        strokeWidth: 8,
        strokeColor: "#022e04",
    });
}
