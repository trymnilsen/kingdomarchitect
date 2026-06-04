import { spriteDefinitions } from "../../../generated/sprites.ts";
import { SPRITE_FRAMES } from "../../asset/sprite.ts";
import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";
import { Entity } from "../entity/entity.ts";
import { generateId } from "../../common/idGenerator.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { createCollectableComponent } from "../component/collectableComponent.ts";
import { createGroundItemComponent } from "../component/groundItemComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { loopAnimation } from "../../rendering/animation/animationGraph.ts";
import { zeroPoint } from "../../common/point.ts";

/**
 * Canonical prefab for any item that exists loose in the world — drops from
 * the held-item system, loot from deaths, and any future drop scenarios all
 * use this prefab. Adds a GroundItemComponent marker so behaviours and
 * queries can identify world-loose item piles distinctly from other
 * collectables (chests, etc.).
 *
 * `reason` records why this pile was dropped and is stored on the collectable
 * component for debugging (shown in the selection tile).
 */
export function collectableItemPrefab(
    item: InventoryItem,
    quantity: number,
    reason?: string,
): Entity {
    const entity = new Entity(generateId("collectable"));
    entity.setEcsComponent(
        createSpriteComponent(item.asset, zeroPoint(), { x: 16, y: 16 }),
    );
    entity.setEcsComponent(
        createCollectableComponent([{ item, amount: quantity }], reason),
    );
    entity.setEcsComponent(createGroundItemComponent());

    const frames = spriteDefinitions[item.asset.spriteId]?.[SPRITE_FRAMES] ?? 1;
    if (frames > 1) {
        entity.setEcsComponent(
            createAnimationComponent(loopAnimation(item.asset)),
        );
    }

    return entity;
}
