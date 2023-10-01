import { sprites2 } from "../../asset/sprite.js";
import { woodenBuildings } from "../../data/building/wood.js";
import { BuildingComponent } from "../component/building/buildingComponent.js";
import { HousingComponent } from "../component/housing/housingComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import { Entity } from "../entity/entity.js";

export function housePrefab(id: string, scaffold: boolean): Entity {
    const house = new Entity(id);
    const buildingComponent = BuildingComponent.createInstance(
        sprites2.wooden_house,
        sprites2.wooden_house_scaffold,
        woodenBuildings[0].id,
    );

    let currentHealth = 100;
    if (scaffold) {
        currentHealth = 10;
    } else {
        buildingComponent.finishBuild();
    }

    const healthComponent = HealthComponent.createInstance(currentHealth, 100, {
        min: 0,
        max: 100,
    });

    const housingComponent = new HousingComponent();
    house.addComponent(buildingComponent);
    house.addComponent(healthComponent);
    house.addComponent(housingComponent);
    return house;
}
