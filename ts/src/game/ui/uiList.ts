import { RenderNode, container } from "../rendering/items/renderNode";
import { rectangle } from "../rendering/items/rectangle";
import { UiWindowType } from "../state/gameState";
import { text } from "../rendering/items/text";

export function uiList(
    options: string[],
    highlightedIndex: number
): RenderNode {
    const listContainer = container();
    const background = rectangle({
        x: 0,
        y: 0,
        width: 300,
        height: options.length * 30,
        fill: "#2e2e2e",
    });
    listContainer.children.push(background);

    for (let i = 0; i < options.length; i++) {
        const label = options[i];
        const textVisual = text({
            x: 16,
            y: 30 * i + 8,
            text: label,
            color: "white",
            weight: "bold",
        });
        listContainer.children.push(textVisual);
        if (i == highlightedIndex) {
            listContainer.children.push(
                rectangle({
                    x: 6,
                    width: 6,
                    height: 6,
                    y: 30 * i + 12,
                    fill: "white",
                })
            );
        }
    }
    return listContainer;
}
