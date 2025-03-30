import { sprites2 } from "../../module/asset/sprite.js";
import { diamondPattern, largeDiamondPattern } from "../../common/pattern.js";
import { zeroPoint } from "../../common/point.js";
import { Building } from "../../data/building/building.js";
import { BuildingComponent } from "../componentOld/building/buildingComponent.js";
import { EntityComponent } from "../componentOld/entityComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import { StaticSelectionInfoProvider } from "../componentOld/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../componentOld/selection/selectionInfoComponent.js";
import { VisibilityComponent } from "../componentOld/visibility/visibilityComponent.js";
import { Entity } from "../entity/entity.js";

export function buildingPrefab(
    id: string,
    building: Building,
    extraComponents: EntityComponent[] = [],
    scaffold: boolean = true,
): Entity {
    const entity = new Entity(id);
    const buildingComponent = new BuildingComponent(
        building.icon,
        sprites2.wooden_house_scaffold,
        building,
        scaffold,
    );
    const maxHealth = 100;
    let currentHealth = 10;
    if (!scaffold) {
        currentHealth = maxHealth;
    }

    const healthComponent = new HealthComponent(currentHealth, maxHealth);
    let pattern = diamondPattern;
    if (building.id == "stonetower") {
        pattern = largeDiamondPattern;
    }

    const visibilityComponent = new VisibilityComponent(pattern, zeroPoint());

    entity.addComponent(
        new SelectionInfoComponent(
            new StaticSelectionInfoProvider(
                building.icon,
                building.name,
                "Building",
            ),
        ),
    );
    entity.addComponent(buildingComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(visibilityComponent);

    for (const extraComponent of extraComponents) {
        entity.addComponent(extraComponent);
    }
    return entity;
}
