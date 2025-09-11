import { generateDiamondPattern } from "../../common/pattern.js";
import type { Point } from "../../common/point.js";

export type VisibilityComponent = {
    id: typeof VisibilityComponentId;
    pattern: Point[];
};

export function createVisibilityComponent(): VisibilityComponent {
    return {
        id: VisibilityComponentId,
        pattern: generateDiamondPattern(5),
    };
}

export const VisibilityComponentId = "visibility";
