import { generateId } from "../../../common/idGenerator.js";
import { woodenBuildings } from "../../../data/building/wood.js";
import { HousingComponent } from "../component/housing/housingComponent.js";
import { buildingPrefab } from "./buildingPrefab.js";
export function buildingFactory(building) {
    const extraComponents = [];
    if (building.id == woodenBuildings[0].id) {
        extraComponents.push(new HousingComponent());
    }
    return buildingPrefab(generateId("building"), building, extraComponents);
}
