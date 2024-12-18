import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsUpdateEvent } from "../../ecs/event/ecsUpdateEvent.js";
import { BuildingComponent } from "../ecsComponent/building/buildingComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";

export function createBuildingSystem(): EcsSystem {
    return createSystem({
        building: BuildingComponent,
        drawable: DrawableComponent,
    })
        .onEvent(EcsUpdateEvent, (_query, _event, _world) => {})
        .build();
}
