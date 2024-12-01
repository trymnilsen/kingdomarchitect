import { EcsComponent } from "./ecsComponent.js";
import { EcsEntity } from "./ecsSystem.js";

export interface EcsWorldScope {
    createEntity(): EcsEntity;
    addComponent(entity: EcsEntity, component: EcsComponent);
    removeComponent(entity: EcsEntity, component: EcsComponent);
    destroyEntity(entity: EcsEntity);
}
