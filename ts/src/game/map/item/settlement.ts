import {
    createKingdomComponent,
    KingdomType,
} from "../../component/kingdomComponent.js";
import type { Entity } from "../../entity/entity.js";
import { goblinFireplace, goblinPrefab } from "../../prefab/goblinPrefab.js";
import type { TileChunk } from "../chunk.js";

export function placeSettlement(_chunk: TileChunk, chunkEntity: Entity) {
    chunkEntity.setEcsComponent(createKingdomComponent(KingdomType.Goblin));
    const goblinEntity = goblinPrefab();
    const goblinFireplaceEntity = goblinFireplace();

    chunkEntity.addChild(goblinEntity);
    chunkEntity.addChild(goblinFireplaceEntity);

    goblinFireplaceEntity.position = { x: 4, y: 3 };
    goblinEntity.position = { x: 3, y: 3 };
}
