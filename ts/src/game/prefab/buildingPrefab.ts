import { sprites2 } from "../../asset/sprite.js";
import { diamondPattern, largeDiamondPattern } from "../../common/pattern.js";
import { zeroPoint } from "../../common/point.js";
import { Building } from "../../data/building/building.js";
import { BuildingComponent } from "../component/building/buildingComponent.js";
import { EntityComponent } from "../component/entityComponent.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import { VisibilityComponent } from "../component/visibility/visibilityComponent.js";
import { Entity } from "../entity/entity.js";

export function buildingPrefab(
    id: string,
    building: Building,
    extraComponents: EntityComponent[],
): Entity {
    const entity = new Entity(id);
    const buildingComponent = BuildingComponent.createInstance(
        building.icon,
        sprites2.wooden_house_scaffold,
        building.id,
    );

    const currentHealth = 10;
    const healthComponent = HealthComponent.createInstance(currentHealth, 100);
    let pattern = diamondPattern;
    if (building.id == "stonetower") {
        pattern = largeDiamondPattern;
    }

    const visibilityComponent = VisibilityComponent.createInstance(
        pattern,
        zeroPoint(),
    );

    entity.addComponent(buildingComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(visibilityComponent);

    for (const extraComponent of extraComponents) {
        entity.addComponent(extraComponent);
    }
    return entity;
}
