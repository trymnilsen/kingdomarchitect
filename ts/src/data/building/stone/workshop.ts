import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { planksItem } from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const workshop: Building = {
    id: "workshop",
    icon: spriteRefs.building_workshop,
    name: "Workshop",
    scale: 2,
    requirements: {
        materials: {
            [stoneResource.id]: 40,
            [planksItem.id]: 40,
        },
    },
};
