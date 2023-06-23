import { clamp } from "../common/number.js";
export var HorizontalAlignment;
(function(HorizontalAlignment) {
    HorizontalAlignment[HorizontalAlignment["Left"] = 0] = "Left";
    HorizontalAlignment[HorizontalAlignment["Center"] = 1] = "Center";
    HorizontalAlignment[HorizontalAlignment["Right"] = 2] = "Right";
})(HorizontalAlignment || (HorizontalAlignment = {}));
export var VerticalAlignment;
(function(VerticalAlignment) {
    VerticalAlignment[VerticalAlignment["Top"] = 0] = "Top";
    VerticalAlignment[VerticalAlignment["Center"] = 1] = "Center";
    VerticalAlignment[VerticalAlignment["Bottom"] = 2] = "Bottom";
})(VerticalAlignment || (VerticalAlignment = {}));
export const uiAlignment = {
    topLeft: {
        x: -1,
        y: -1
    },
    topCenter: {
        x: 0,
        y: -1
    },
    topRight: {
        x: 1,
        y: -1
    },
    centerLeft: {
        x: -1,
        y: 0
    },
    center: {
        x: 0,
        y: 0
    },
    centerRight: {
        x: 1,
        y: 0
    },
    bottomLeft: {
        x: -1,
        y: 1
    },
    bottomCenter: {
        x: 0,
        y: 1
    },
    bottomRight: {
        x: 1,
        y: 1
    }
};
export function calculateAlignment(width, height, alignment, itemWidth, itemHeight) {
    const halfWidthConstraint = width / 2;
    const halfHeightConstraint = height / 2;
    const widthAlignment = halfWidthConstraint * alignment.x + halfWidthConstraint;
    const heightAlignment = halfHeightConstraint * alignment.y + halfHeightConstraint;
    const offsetX = widthAlignment - itemWidth / 2;
    const offsetY = heightAlignment - itemHeight / 2;
    const clampedOffsetX = clamp(offsetX, 0, width - itemWidth);
    const clampedOffsetY = clamp(offsetY, 0, height - itemHeight);
    return {
        x: clampedOffsetX,
        y: clampedOffsetY
    };
}
