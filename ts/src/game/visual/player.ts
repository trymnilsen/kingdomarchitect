import { RenderNode, container } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";
import { Direction } from "../../data/direction";

export function playerVisual(direction: Direction): RenderNode {
    const parent = container({ x: 0, y: 0 });
    const body = rectangle({
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        fill: "#6f0091",
        depth: 100,
    });
    let face;
    switch (direction) {
        case Direction.Down:
            face = rectangle({
                x: 8,
                y: 24,
                width: 16,
                height: 8,
                fill: "#2f013d",
                depth: 101,
            });
            break;
        case Direction.Up:
            face = rectangle({
                x: 8,
                y: 0,
                width: 16,
                height: 8,
                fill: "#2f013d",
                depth: 101,
            });
            break;
        case Direction.Left:
            face = rectangle({
                x: 0,
                y: 8,
                width: 8,
                height: 16,
                fill: "#2f013d",
                depth: 101,
            });
            break;
        case Direction.Right:
        default:
            face = rectangle({
                x: 24,
                y: 8,
                width: 8,
                height: 16,
                fill: "#2f013d",
                depth: 101,
            });
            break;
    }
    parent.children.push(body);
    parent.children.push(face);
    return parent;
}
