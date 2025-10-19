import { generateDiamondPattern } from "../../common/pattern.js";
import type { Point } from "../../common/point.js";

export type SpaceComponent = {
    id: typeof SpaceComponentId;
};

export function createSpaceComponent(): SpaceComponent {
    return {
        id: SpaceComponentId,
    };
}

export const SpaceComponentId = "space";
