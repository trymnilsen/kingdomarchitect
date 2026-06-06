import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { lampPostLightSource } from "../../light/lightSourceDefinition.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";
import { ironBarsItem } from "../../inventory/items/processedMaterials.ts";

/**
 * A lamp post: durable infrastructure with the widest dim reach of this slice.
 * Its iron-bar requirement marks it as the costly, permanent option versus the
 * throwaway torch. Emission is described by {@link lampPostLightSource}.
 */
export const lampPost: Building = {
    id: "lampPost",
    icon: spriteRefs.lamp_post,
    name: "Lamp Post",
    scale: 1,
    //previewScale: 2,
    previewOffset: 0,
    light: lampPostLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 3,
            [ironBarsItem.id]: 2,
        },
    },
};
