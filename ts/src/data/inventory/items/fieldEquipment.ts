import { spriteRefs } from "../../../asset/sprite.ts";
import { ItemRarity } from "../inventoryItem.ts";

/**
 * A portable bedroll that allows a worker to sleep outdoors with better
 * rest quality than collapsing in place. Workers with a bedroll near a
 * campfire sleep at bedrollFire quality; otherwise bedrollAlone quality.
 */
export const bedrollItem = {
    asset: spriteRefs.wood_resource, // TODO: replace with bedroll sprite when available
    id: "bedroll",
    name: "Bedroll",
    hint: "A compact sleeping roll for camp use",
    rarity: ItemRarity.Common,
} as const;
