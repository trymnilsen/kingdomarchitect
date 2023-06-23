import { sprites2 } from "../../asset/sprite.js";
import { Building } from "./building.js";

export const goldBuildings: Building[] = [
    {
        id: "enchanter",
        icon: sprites2.building_enchanter,
        name: "Enchanter",
        scale: 2,
    },
    {
        id: "church",
        icon: sprites2.building_chapel,
        name: "Church",
        scale: 2,
    },
    {
        id: "library",
        icon: sprites2.building_library,
        name: "Library",
        scale: 2,
    },
    {
        id: "angelstatue",
        icon: sprites2.building_statue,
        name: "Angel statue",
        scale: 2,
    },
];
