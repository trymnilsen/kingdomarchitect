import {
    buildSpriteSheet,
    type SpriteDefinitionCache,
} from "../../devtools/characterbuilder/characterSpriteGenerator.ts";
import { characterPartFrames } from "../../../generated/characterFrames.ts";
import { getAllAnimations } from "../../devtools/characterbuilder/animation/getAllAnimations.ts";
import type { CharacterAnimation } from "../../rendering/character/characterAnimation.ts";
import { log } from "../../common/logging/logger.ts";
import { getCharacterColors } from "../appearance/getCharacterColors.ts";
import { getSpriteForState } from "../appearance/getSpriteForState.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { AssetLoader } from "../../asset/loader/assetLoader.ts";
import type { OffscreenCanvasFactory } from "../../rendering/renderScope.ts";
import { AnimationComponentId } from "../component/animationComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import type { Entity } from "../entity/entity.ts";

export function createSpriteEquipmentSystem(
    createOffscreenCanvas: OffscreenCanvasFactory,
    assetLoader: AssetLoader,
    spriteCache: SpriteDefinitionCache,
): EcsSystem {
    return {
        onComponent: {
            updated: {
                [EquipmentComponentId]: (_root, event) => {
                    updateEquipmentSprite(
                        event.source,
                        createOffscreenCanvas,
                        assetLoader,
                        spriteCache,
                    );
                },
            },
        },
        onEntityEvent: {
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
    const animations = getAllAnimations(
        characterPartFrames as unknown as CharacterAnimation[],
    );
    const sheet = buildSpriteSheet(
        offscreenCanvasFactory,
        colors,
        assetLoader,
        spriteCache,
        animations,
    );
    log.info("Update equipment sprite", { colors });
    // The new sheet replaces the one the current animation state was drawing
    // from, so pick that state's sprite out of it. The frame is kept as the
    // animation itself has not changed, only the colors it is drawn in.
    const animatable = target.requireEcsComponent(AnimationComponentId);
    spriteComponent.sprite = getSpriteForState(
        animatable,
        animatable.currentAnimation,
        target,
        spriteCache,
    );
    // Every animation in a character sheet is drawn with the same offset
    spriteComponent.offset = sheet[0].offset;
}
