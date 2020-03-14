/* import { RenderNode, UiRenderNode } from "../../rendering/items/renderNode";
import { Rectangle } from "../../rendering/items/rectangle";
import { TileSize } from "./chunk";
import { Point } from "../../../data/point";
import { DataNodeReference } from "../../../state/dataNode";
import { TextVisual } from "../../rendering/items/text";

export class WhatAmILookingAt {
    private container: RenderNode;
    private label: TextVisual;
    public constructor(renderNode: RenderNode, state: DataNodeReference) {
        //const position = state.get("position").value<Point>();
        this.container = new UiRenderNode({
            x: window.innerWidth / 2 - 100 + TileSize / 2,
            y: 32,
            depth: 1000
        });
        const rect = new Rectangle({
            width: 200,
            height: 50,
            color: "#404040",
            x: 0,
            y: 0,
            depth: 1000
        });

        this.label = new TextVisual({
            text: "Tree",
            x: 100,
            y: 32,
            color: "white",
            align: "center",
            depth: 1001
        });

        this.container.addChild(rect);
        this.container.addChild(this.label);
        renderNode.addChild(this.container);
    }
} */
