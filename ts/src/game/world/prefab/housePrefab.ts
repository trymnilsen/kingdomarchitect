import { sprites2 } from "../../../asset/sprite";
import { woodenBuildings } from "../../../data/building/wood";
import { BuildingComponent } from "../component/building/buildingComponent";
import { HousingComponent } from "../component/housing/housingComponent";
import { HealthComponent } from "../component/health/healthComponent";
import { Entity } from "../entity/entity";

export function housePrefab(
    id: string,
    scaffold: boolean,
    initalResident?: Entity
): Entity {
    const house = new Entity(id);
    const buildingComponent = new BuildingComponent(
        sprites2.wooden_house,
        sprites2.wooden_house_scaffold,
        woodenBuildings[0]
    );

    let currentHealth = 100;
    if (scaffold) {
        currentHealth = 10;
    } else {
        buildingComponent.finishBuild();
    }

    const healthComponent = new HealthComponent(currentHealth, 100, {
        min: 0,
        max: 100,
    });

    const housingComponent = new HousingComponent();
    house.addComponent(buildingComponent);
    house.addComponent(healthComponent);
    house.addComponent(housingComponent);
    return house;
}
