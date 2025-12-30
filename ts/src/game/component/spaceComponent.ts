import { generateDiamondPattern } from "../../common/pattern.ts";
import type { Point } from "../../common/point.ts";

export type SpaceComponent = {
    id: typeof SpaceComponentId;
};

export function createSpaceComponent(): SpaceComponent {
    return {
        id: SpaceComponentId,
    };
}

export const SpaceComponentId = "space";
