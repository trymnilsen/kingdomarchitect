import { generateId } from "../../common/idGenerator.js";
import { Building } from "../../data/building/building.js";
import { woodenBuildings } from "../../data/building/wood/wood.js";
import { EntityComponent } from "../component/entityComponent.js";
import { HousingComponent } from "../component/housing/housingComponent.js";
import { Entity } from "../entity/entity.js";
import { buildingPrefab } from "./buildingPrefab.js";

export function buildingFactory(building: Building): Entity {
    const extraComponents: EntityComponent[] = [];
    if (building.id == woodenBuildings[0].id) {
        extraComponents.push(new HousingComponent());
    }
    return buildingPrefab(generateId("building"), building, extraComponents);
}
