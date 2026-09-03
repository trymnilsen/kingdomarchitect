import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { ironBrazierLightSource } from "../../light/lightSourceDefinition.ts";
import { stoneResource } from "../../inventory/items/resources.ts";
import { ironBarsItem } from "../../inventory/items/processedMaterials.ts";

export const ironBrazier: Building = {
    id: "ironBrazier",
    icon: spriteRefs.iron_brazier,
    name: "Brazier",
    scale: 1,
    previewOffset: 0,
    light: ironBrazierLightSource.id,
    requirements: {
        materials: {
            [ironBarsItem.id]: 4,
            [stoneResource.id]: 2,
        },
    },
};
