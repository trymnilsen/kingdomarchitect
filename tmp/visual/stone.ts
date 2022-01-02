import { container } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";

export function stoneVisual() {
    const stoneContainer = container();
    const stone1 = rectangle({
        fill: "#525252",
        x: 6,
        y: 16,
        width: 8,
        height: 8,
    });
    const stone2 = rectangle({
        fill: "#525252",
        x: 20,
        y: 4,
        width: 8,
        height: 8,
    });
    const stone3 = rectangle({
        fill: "#525252",
        x: 20,
        y: 20,
        width: 8,
        height: 8,
    });
    stoneContainer.children.push(stone1);
    stoneContainer.children.push(stone2);
    stoneContainer.children.push(stone3);
    return stoneContainer;
}
