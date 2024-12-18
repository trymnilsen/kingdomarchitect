import { forEachOf } from "../../common/array.js";
import { entityOf } from "../../ecs/ecsComponent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsWorldScope, RootEntity } from "../../ecs/ecsWorldScope.js";
import {
    ComponentEventType,
    EcsComponentEvent,
} from "../../ecs/event/ecsComponentEvent.js";
import { EcsTransformEvent } from "../../ecs/event/ecsTransformEvent.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { ChunkMapComponent } from "../ecsComponent/world/chunkmapComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function createCollisionSystem(): EcsSystem {
    return createSystem()
        .onEvent(EcsTransformEvent, (_query, event, world) => {
            updateChunkmapTransform(event, world);
        })
        .onEvent(EcsComponentEvent, (_query, event, world) => {
            forEachOf(event.component, (component) => {
                if (component instanceof ColliderComponent) {
                    updateChunkmapCollider(component, world, event.type);
                }
            });
        })
        .build();
}

function updateChunkmapTransform(
    event: EcsTransformEvent,
    world: EcsWorldScope,
) {
    const chunkmap = getChunkmap(world);
    chunkmap.updateTransform(event.transform);
}

function updateChunkmapCollider(
    collider: ColliderComponent,
    world: EcsWorldScope,
    eventType: ComponentEventType,
) {
    const entity = entityOf(collider);
    const transform = world.components.getComponent(entity, TransformComponent);
    if (!transform) {
        throw new Error(
            `Entity ${entity} has no Transform, cannot change chunkmap`,
        );
    }
    const chunkmap = getChunkmap(world);
    switch (eventType) {
        case ComponentEventType.Add:
            chunkmap.add(collider, transform);
            break;
        case ComponentEventType.Remove:
            chunkmap.remove(transform);
            break;
    }
}

function getChunkmap(world: EcsWorldScope): ChunkMapComponent {
    const chunkmap = world.components.getComponent(
        RootEntity,
        ChunkMapComponent,
    );
    if (!chunkmap) {
        throw new Error("No chunkmap added to root");
    }

    return chunkmap;
}
