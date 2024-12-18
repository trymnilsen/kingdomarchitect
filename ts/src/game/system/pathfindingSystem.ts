import { entityOf } from "../../ecs/ecsComponent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsWorldScope, RootEntity } from "../../ecs/ecsWorldScope.js";
import { EcsComponentEvent } from "../../ecs/event/ecsComponentEvent.js";
import { EcsTransformEvent } from "../../ecs/event/ecsTransformEvent.js";
import { PathfindingComponent } from "../ecsComponent/world/pathfindingComponent.js";

export function createPathfindingSystem(): EcsSystem {
    return createSystem()
        .onEvent(EcsTransformEvent, (_query, event, world) => {
            updatePathfinding(event, world);
        })
        .onEvent(EcsComponentEvent, (_query, _event, _world) => {
            /*
            forEachOf(event.component, (component) => {
                if (component instanceof ColliderComponent) {
                    updateChunkmapCollider(component, world, event.type);
                }
            });*/
        })
        .build();
}

function updatePathfinding(event: EcsTransformEvent, world: EcsWorldScope) {
    const graph = world.components.getComponent(
        RootEntity,
        PathfindingComponent,
    );

    if (!graph) {
        return;
    }

    graph.graph.invalidatePoint(event.oldPosition);
}
