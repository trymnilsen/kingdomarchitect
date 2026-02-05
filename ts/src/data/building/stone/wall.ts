import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { stoneResource } from "../../inventory/items/resources.ts";

export const stoneWall = {
    id: "stonewall",
    icon: sprites2.stone_wood_walls,
    name: "Stone wall",
    scale: 1,
    requirements: {
        materials: {
            [stoneResource.id]: 10,
        },
    },
} as const satisfies Building;
