import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    joineryItem,
    stoneBarsItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const gate: Building = {
    id: "gate",
    icon: spriteRefs.gate_horizontal_preview,
    name: "Gate",
    scale: 4,
    requirements: {
        materials: {
            [woodResourceItem.id]: 25,
            [stoneResource.id]: 30,
            [goldCoins.id]: 5,
            [joineryItem.id]: 10,
            [stoneBarsItem.id]: 8,
        },
    },
};
