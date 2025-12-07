import {
    buildSpriteSheet,
    type SpriteDefinitionCache,
} from "../../characterbuilder/characterSpriteGenerator.js";
import {
    getCharacterColors,
    type CharacterColors,
} from "../../characterbuilder/colors.js";
import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import type { AssetLoader } from "../../asset/loader/assetLoader.js";
import type {
    OffscreenCanvasFactory,
    RenderScope,
} from "../../rendering/renderScope.js";
import {
    EquipmentComponentId,
    type EquipmentComponent,
} from "../component/equipmentComponent.js";
import {
    SpriteComponentId,
    type SpriteComponent,
} from "../component/spriteComponent.js";
import type { Entity } from "../entity/entity.js";
import type {
    ComponentsUpdatedEvent,
    EntityChildrenUpdatedEvent,
} from "../entity/entityEvent.js";

export function createSpriteEquipmentSystem(
    createOffscreenCanvas: OffscreenCanvasFactory,
    assetLoader: AssetLoader,
    spriteCache: SpriteDefinitionCache,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                if (event.item.id === EquipmentComponentId) {
                    updateEquipmentSprite(
                        event.source,
                        createOffscreenCanvas,
                        assetLoader,
                        spriteCache,
                    );
                }
            },
            child_added: (_root, event) => {
                const equipmentComponent =
                    event.target.getEcsComponent(EquipmentComponentId);

                if (equipmentComponent) {
                    updateEquipmentSprite(
                        event.target,
                        createOffscreenCanvas,
                        assetLoader,
                        spriteCache,
                    );
                }
            },
        },
    };
}

function updateEquipmentSprite(
    target: Entity,
    offscreenCanvasFactory: OffscreenCanvasFactory,
    assetLoader: AssetLoader,
    spriteCache: SpriteDefinitionCache,
): void {
    const spriteComponent = target.getEcsComponent(SpriteComponentId);
    if (!spriteComponent) return;
    const equipment = target.requireEcsComponent(EquipmentComponentId);
    const colors = getCharacterColors(equipment);
    const sprite = buildSpriteSheet(
        offscreenCanvasFactory,
        colors,
        assetLoader,
        spriteCache,
    );
    //Update the sprite
    const animation = sprite[0];
    spriteComponent.sprite = animation.sprite;
    spriteComponent.offset = animation.offset;
}
