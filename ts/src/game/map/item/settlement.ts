import {
    createKingdomComponent,
    KingdomType,
} from "../../component/kingdomComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { goblinFireplace, goblinPrefab } from "../../prefab/goblinPrefab.ts";
import type { TileChunk } from "../chunk.ts";

export function placeSettlement(_chunk: TileChunk, chunkEntity: Entity) {
    chunkEntity.setEcsComponent(createKingdomComponent(KingdomType.Goblin));
    const goblinEntity = goblinPrefab();
    const goblinFireplaceEntity = goblinFireplace();

    chunkEntity.addChild(goblinEntity);
    chunkEntity.addChild(goblinFireplaceEntity);

    goblinFireplaceEntity.position = { x: 4, y: 3 };
    goblinEntity.position = { x: 3, y: 3 };
}
