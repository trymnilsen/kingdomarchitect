import { spriteDefinitions } from "../../../generated/sprites.ts";
import { SPRITE_FRAMES } from "../../asset/sprite.ts";
import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";
import { Entity } from "../entity/entity.ts";
import { generateId } from "../../common/idGenerator.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { createCollectableComponent } from "../component/collectableComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { loopAnimation } from "../../rendering/animation/animationGraph.ts";
import { zeroPoint } from "../../common/point.ts";

export function collectableItemPrefab(
    item: InventoryItem,
    quantity: number,
): Entity {
    const entity = new Entity(generateId("collectable"));
    entity.setEcsComponent(
        createSpriteComponent(item.asset, zeroPoint(), { x: 16, y: 16 }),
    );
    entity.setEcsComponent(
        createCollectableComponent([{ item, amount: quantity }]),
    );

    const frames = spriteDefinitions[item.asset.spriteId]?.[SPRITE_FRAMES] ?? 1;
    if (frames > 1) {
        entity.setEcsComponent(
            createAnimationComponent(loopAnimation(item.asset)),
        );
    }

    return entity;
}
