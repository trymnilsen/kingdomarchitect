import { zeroPoint, type Point } from "../common/point.js";
import type { UISize } from "../module/ui/uiSize.js";
import type { UiNode } from "./render.js";

export function setLayoutOffset(node: UiNode, offset: Point) {
    if (node.layout) {
        node.layout.offset = offset;
    }
}

export function setLayout(node: UiNode, size: UISize) {
    node.layout = {
        offset: zeroPoint(),
        region: {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
        },
    };
}
