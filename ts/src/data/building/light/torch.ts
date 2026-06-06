import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { torchLightSource } from "../../light/lightSourceDefinition.ts";
import {
    woodResourceItem,
    strawResourceItem,
} from "../../inventory/items/resources.ts";

/**
 * A staked torch: the cheapest placed light, lighting only its own tile and the
 * cardinal neighbours. Emission is described by {@link torchLightSource}; this
 * def only points {@link Building.light} at that profile so it flows through the
 * generic light attach path with no special wiring.
 */
export const torch: Building = {
    id: "torch",
    icon: spriteRefs.torches,
    name: "Torch",
    scale: 1,
    previewScale: 2,
    previewOffset: 0,
    light: torchLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 2,
            [strawResourceItem.id]: 1,
        },
    },
};
