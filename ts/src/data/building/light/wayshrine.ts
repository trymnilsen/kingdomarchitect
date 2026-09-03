import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { wayshrineLightSource } from "../../light/lightSourceDefinition.ts";
import {
    stoneResource,
    strawResourceItem,
} from "../../inventory/items/resources.ts";

export const wayshrine: Building = {
    id: "wayshrine",
    icon: spriteRefs.wayshrine,
    name: "Wayshrine",
    scale: 1,
    previewOffset: 0,
    light: wayshrineLightSource.id,
    requirements: {
        materials: {
            [stoneResource.id]: 2,
            [strawResourceItem.id]: 1,
        },
    },
};
