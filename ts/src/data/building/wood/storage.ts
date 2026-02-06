import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    ironBarsItem,
    planksItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const stockPile: Building = {
    id: "stockpile",
    icon: spriteRefs.stockpile,
    name: "Stockpile",
    scale: 2,
};

export const warehouse: Building = {
    id: "warehouse",
    icon: spriteRefs.warehouse,
    name: "Warehouse",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 40,
            [stoneResource.id]: 10,
            [planksItem.id]: 20,
            [ironBarsItem.id]: 5,
        },
    },
};
