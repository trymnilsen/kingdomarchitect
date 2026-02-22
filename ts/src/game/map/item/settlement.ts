import {
    createKingdomComponent,
    KingdomType,
} from "../../component/kingdomComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { goblinCampPrefab } from "../../prefab/goblinCampPrefab.ts";
import type { TileChunk } from "../chunk.ts";

/**
 * Places a goblin settlement in a chunk.
 * Creates a camp entity with an initial goblin.
 * The goblin must build their own fire and other structures.
 */
export function placeSettlement(_chunk: TileChunk, chunkEntity: Entity) {
    chunkEntity.setEcsComponent(createKingdomComponent(KingdomType.Goblin));

    const { camp } = goblinCampPrefab();

    chunkEntity.addChild(camp);

    // Position camp in chunk
    camp.position = { x: 4, y: 3 };
}
