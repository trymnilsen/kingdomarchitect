import { sprites2 } from "../../asset/sprite.js";
import { Building } from "./building.js";

export const woodenBuildings: Building[] = [
    {
        id: "woodenhouse",
        icon: sprites2.wooden_house,
        name: "Wooden House",
        scale: 4,
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
    {
        id: "stockpile",
        icon: sprites2.stockpile,
        name: "Stockpile",
        scale: 2,
    },
    {
        id: "warehouse",
        icon: sprites2.warehouse,
        name: "Warehouse",
        scale: 2,
    },
];
