import { RenderNode } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";

export function campfireVisual(): RenderNode {
    return rectangle({
        x: 8,
        y: 8,
        width: 16,
        height: 16,
        fill: "#fc9003",
        strokeWidth: 4,
        strokeColor: "#40280a",
    });
}
