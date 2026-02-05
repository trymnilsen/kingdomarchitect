import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { timberFramesItem } from "../../inventory/items/processedMaterials.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const quary: Building = {
    id: "quary",
    icon: sprites2.building_quarry,
    name: "Quarry",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 50,
            [timberFramesItem.id]: 10,
        },
    },
};
