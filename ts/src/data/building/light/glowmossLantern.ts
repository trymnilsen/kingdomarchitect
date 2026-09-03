import { spriteRefs } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
import { glowmossLanternLightSource } from "../../light/lightSourceDefinition.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";
import { ironBarsItem } from "../../inventory/items/processedMaterials.ts";

export const glowmossLantern: Building = {
    id: "glowmossLantern",
    icon: spriteRefs.glowmoss_lantern,
    name: "Glowmoss Lantern",
    scale: 1,
    previewOffset: 0,
    light: glowmossLanternLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 2,
            [ironBarsItem.id]: 1,
        },
        special: [SpecialRequirement.MagicalFocusItem],
    },
};
