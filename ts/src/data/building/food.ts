import { sprites2 } from "../../asset/sprite";
import { Building } from "./building";

export const foodBuildings: Building[] = [
    {
        icon: sprites2.farm_4,
        name: "Farm",
        scale: 1,
    },
    {
        icon: sprites2.building_mill,
        name: "Windmill",
        scale: 2,
    },
    {
        icon: sprites2.building_tavern,
        name: "Tavern",
        scale: 2,
    },
    {
        icon: sprites2.building_baker,
        name: "Baker",
        scale: 2,
    },
];
