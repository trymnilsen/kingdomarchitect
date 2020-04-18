import { RenderNode, container } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";

export function playerVisual(): RenderNode {
    const parent = container({ x: 0, y: 0 });
    const body = rectangle({
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        fill: "#6f0091",
    });
    parent.children.push(body);
    return parent;
}
