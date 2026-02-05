import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { planksItem } from "../../inventory/items/processedMaterials.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const bowyer: Building = {
    id: "bowyer",
    icon: sprites2.building_bowyer,
    name: "Bowyer",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 50,
            [planksItem.id]: 10,
        },
    },
};
