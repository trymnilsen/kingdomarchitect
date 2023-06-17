import { sprites2 } from "../../../asset/sprite";
import { Building } from "../../../data/building/building";
import { BuildingComponent } from "../component/building/buildingComponent";
import { HealthComponent } from "../component/health/healthComponent";
import { Entity } from "../entity/entity";

export function buildingPrefab(id: string, building: Building): Entity {
    const entity = new Entity(id);
    const buildingComponent = new BuildingComponent(
        building.icon,
        sprites2.wooden_house_scaffold,
        building
    );
    const currentHealth = 10;

    const healthComponent = new HealthComponent(currentHealth, 100, {
        min: 0,
        max: 100,
    });

    entity.addComponent(buildingComponent);
    entity.addComponent(healthComponent);
    return entity;
}
