import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { pyreLightSource } from "../../light/lightSourceDefinition.ts";
import {
    woodResourceItem,
    strawResourceItem,
} from "../../inventory/items/resources.ts";

export const pyre: Building = {
    id: "pyre",
    icon: spriteRefs.pyre,
    name: "Pyre",
    scale: 1,
    previewOffset: 0,
    light: pyreLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 6,
            [strawResourceItem.id]: 2,
        },
    },
};
