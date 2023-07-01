import { sprites2 } from "../../asset/sprite.js";
import { Building } from "./building.js";

export const woodenBuildings: Building[] = [
    {
        id: "woodenhouse",
        icon: sprites2.wooden_house,
        name: "Wooden House",
        scale: 1,
    },
    {
        id: "forrester",
        icon: sprites2.building_forrester,
        name: "Forrester",
        scale: 2,
    },
    {
        id: "bowyer",
        icon: sprites2.building_bowyer,
        name: "Bowyer",
        scale: 2,
    },
];
