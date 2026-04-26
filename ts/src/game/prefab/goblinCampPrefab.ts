import { generateId } from "../../common/idGenerator.ts";
import { Entity } from "../entity/entity.ts";
import { createGoblinCampComponent } from "../component/goblinCampComponent.ts";
import { createJobQueueComponent } from "../component/jobQueueComponent.ts";
import { goblinPrefab } from "./goblinPrefab.ts";
import { buildingPrefab } from "./buildingPrefab.ts";
import { goblinCampfire } from "../../data/building/goblin/goblinCampfire.ts";

/**
 * Creates a goblin camp entity with an initial campfire and goblin.
 * The campfire is the permanent anchor of the camp — as long as it stands,
 * goblins will be attracted back even if all are killed.
 *
 * Camp entity structure:
 * - Camp (GoblinCampComponent, JobQueueComponent)
 *   - Campfire (pre-built FireSourceComponent)
 *   - Initial Goblin (GoblinUnitComponent linked to camp)
 */
export function goblinCampPrefab(): { camp: Entity; goblin: Entity } {
    const camp = new Entity(generateId("goblinCamp"));
    camp.setEcsComponent(createGoblinCampComponent(5));
    camp.setEcsComponent(createJobQueueComponent());

    const campfire = buildingPrefab(goblinCampfire, false);
    camp.addChild(campfire);
    campfire.position = { x: 0, y: 0 };

    const goblin = goblinPrefab(camp.id);
    camp.addChild(goblin);
    goblin.position = { x: 1, y: 0 };

    return { camp, goblin };
}
