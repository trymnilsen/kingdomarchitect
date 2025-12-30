import { generateDiamondPattern } from "../../common/pattern.ts";
import type { Point } from "../../common/point.ts";

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
