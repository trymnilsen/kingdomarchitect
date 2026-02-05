import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const forrester: Building = {
    id: "forrester",
    icon: sprites2.building_forrester,
    name: "Forrester",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 50,
        },
    },
};
