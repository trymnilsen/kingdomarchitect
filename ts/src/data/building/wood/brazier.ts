import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { brazierLightSource } from "../../light/lightSourceDefinition.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const brazier: Building = {
    id: "brazier",
    icon: spriteRefs.stone_brazier,
    name: "Brazier",
    scale: 1,
    previewScale: 2,
    previewOffset: 0,
    light: brazierLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 5,
        },
    },
};
