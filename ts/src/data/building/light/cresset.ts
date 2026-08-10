import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { cressetLightSource } from "../../light/lightSourceDefinition.ts";
import {
    woodResourceItem,
    strawResourceItem,
} from "../../inventory/items/resources.ts";

/**
 * A cresset: a staked iron fire-basket, the cheapest deliberate placed light.
 * It lights only its own tile and the cardinal neighbours. Emission is described
 * by {@link cressetLightSource}; this def only points {@link Building.light} at
 * that profile so it flows through the generic light attach path with no special
 * wiring.
 */
export const cresset: Building = {
    id: "cresset",
    icon: spriteRefs.torches,
    name: "Cresset",
    scale: 1,
    //previewScale: 2,
    previewOffset: 0,
    light: cressetLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 2,
            [strawResourceItem.id]: 1,
        },
    },
};
