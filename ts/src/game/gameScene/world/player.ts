import { DataTree } from "../../../state/dataNode";
import { Point } from "../../../data/point";
import { RenderNode } from "../../rendering/items/renderNode";
import { rectangle } from "../../rendering/items/rectangle";

/* import { RenderNode } from "../../rendering/items/renderNode";
import { Rectangle } from "../../rendering/items/rectangle";
import { TileSize } from "./chunk";
import { Point } from "../../../data/point";
import { DataNodeReference, DataTree } from "../../../state/dataNode";

export class Player {
    private playerVisual: Rectangle;
    public constructor(renderNode: RenderNode, state: DataNodeReference) {
        const position = state.get("position").value<Point>();
        this.playerVisual = new Rectangle({
            width: TileSize - 8,
            height: TileSize - 8,
            color: "red",
            x: position.x * TileSize + 4,
            y: position.y * TileSize + 4,
            depth: 1000
        });
        renderNode.addChild(this.playerVisual);
        state.listen((event) => {
            console.log("Player updated", event);
            const newPosition = event.data as Point;
            this.playerVisual.position = {
                x: newPosition.x * TileSize + 4,
                y: newPosition.y * TileSize + 4
            };
        });
    }
}
 */
export function getPlayerPosition(state: DataTree): Point {
    const position = state.get(["world", "player", "position"]).value<Point>();
    if (!!position) {
        return position;
    } else {
        console.error("Unable to get player position");
        return { x: 0, y: 0 };
    }
}

export function renderPlayer(state: DataTree): RenderNode {
    const playerPosition = getPlayerPosition(state);
    const playerVisual = rectangle({
        width: 64,
        height: 64,
        x: playerPosition.x * 64,
        y: playerPosition.y * 64,
        color: "red",
        depth: 10
    });
    return playerVisual;
}
