import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { planksItem } from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const blacksmith: Building = {
    id: "blacksmith",
    icon: sprites2.building_blacksmith,
    name: "Blacksmith",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
            [stoneResource.id]: 30,
            [planksItem.id]: 20,
        },
    },
};
