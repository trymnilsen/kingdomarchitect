import { generateId } from "../../common/idGenerator.ts";
import {
    createKingdomComponent,
    KingdomType,
} from "../component/kingdomComponent.ts";
import { createJobQueueComponent } from "../component/jobQueueComponent.ts";
import { createPlayerKingdomComponent } from "../component/playerKingdomComponent.ts";
import { Entity } from "../entity/entity.ts";

/**
 * Creates the player kingdom entity.
 * Acts as the hierarchical boundary for all player buildings and workers,
 * mirroring the goblin camp pattern.
 *
 * Kingdom entity structure:
 * - PlayerKingdom (PlayerKingdomComponent, JobQueueComponent, KingdomComponent(Player))
 *   - Workers
 *   - Buildings
 */
export function playerKingdomPrefab(): Entity {
    const entity = new Entity(generateId("playerKingdom"));
    entity.setEcsComponent(createPlayerKingdomComponent());
    entity.setEcsComponent(createJobQueueComponent());
    entity.setEcsComponent(createKingdomComponent(KingdomType.Player));
    return entity;
}
