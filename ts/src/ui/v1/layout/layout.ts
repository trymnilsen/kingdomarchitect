import { Bounds, withinRectangle } from "../../../common/bounds";
import { Point } from "../../../common/point";
import { RenderContext } from "../../../rendering/renderContext";
import { LayoutNode } from "./layoutNode";

export function drawLayout(
    renderContext: RenderContext,
    layoutNode: LayoutNode
) {
    drawNode(renderContext, layoutNode);
    for (const child of layoutNode.children) {
        drawLayout(renderContext, child);
    }
}

function drawNode(context: RenderContext, node: LayoutNode) {
    switch (node.type) {
        case "IMAGE":
            context.drawScreenSpaceImage(
                {
                    x: node.x,
                    y: node.y,
                    ...node.configuration,
                },
                1
            );
            break;
        case "RECTANGLE":
            context.drawScreenSpaceRectangle({
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
            });
            break;
        case "TEXT":
            context.drawText({
                x: node.x,
                y: node.y,
                ...node.configuration,
            });
        default:
            break;
    }
}

export interface TapLayoutResult {
    handled: boolean;
    data: unknown | null;
}

const notHandledTapResult: TapLayoutResult = {
    handled: false,
    data: null,
};

export function onTapLayout(
    layoutNode: LayoutNode,
    point: Point
): TapLayoutResult {
    const isWithinBounds = withinRectangle(
        point,
        layoutNode.x,
        layoutNode.y,
        layoutNode.x + layoutNode.width,
        layoutNode.y + layoutNode.height
    );
    if (isWithinBounds) {
        // If the tap is within the bounds of the node let any children
        // potentially handle the tap first
        let tapResult = notHandledTapResult;
        for (const child of layoutNode.children) {
            tapResult = onTapLayout(child, point);
            // If the tap was handled by a child stop checking for taps in other
            // children. Only one child can handle a tap as of now
            if (tapResult.handled) {
                break;
            }
        }

        // The tap was handled by a child
        if (tapResult.handled) {
            return tapResult;
        }

        // We have iterated over the children without having hit anything
        // but we know that we are inside the bounds of this node so lets
        // check if the tap is handled for this node
        if (!tapResult.handled && layoutNode.onTap) {
            const tapData = layoutNode.onTap();
            if (tapData) {
                return {
                    handled: true,
                    data: tapData,
                };
            }
        }

        // The tap was inside the node but was not handled by either this
        // node or any of its children
        return notHandledTapResult;
    } else {
        // Tap was not inside the node so we dont handle the tap
        return notHandledTapResult;
    }
}

export function addChild(parent: LayoutNode, child: LayoutNode) {
    // Transform the childs positions to be relative to the parent
    offsetNode({ x: parent.x, y: parent.y }, child);

    parent.children.push(child);
}

function offsetNode(offset: Point, node: LayoutNode) {
    node.x += offset.x;
    node.y += offset.y;
    for (const child of node.children) {
        offsetNode(offset, child);
    }
}
