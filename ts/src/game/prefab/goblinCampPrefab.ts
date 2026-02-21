import { generateId } from "../../common/idGenerator.ts";
import { Entity } from "../entity/entity.ts";
import { createGoblinCampComponent } from "../component/goblinCampComponent.ts";
import { createJobQueueComponent } from "../component/jobQueueComponent.ts";
import { goblinPrefab } from "./goblinPrefab.ts";

/**
 * Creates a goblin camp entity with an initial goblin.
 * The camp entity acts as a parent/container for all camp buildings and goblins.
 *
 * Camp entity structure:
 * - Camp (GoblinCampComponent, JobQueueComponent)
 *   - Initial Goblin (GoblinUnitComponent linked to camp)
 *
 * The camp has its own JobQueueComponent so goblins find it via ancestor
 * traversal when looking for jobs to perform.
 *
 * Note: NO fire or stockpile - the goblin must build these from scratch.
 */
export function goblinCampPrefab(): { camp: Entity; goblin: Entity } {
    const camp = new Entity(generateId("goblinCamp"));
    camp.setEcsComponent(createGoblinCampComponent(5));
    camp.setEcsComponent(createJobQueueComponent());

    // Create initial goblin linked to this camp
    const goblin = goblinPrefab(camp.id);

    // Add goblin as child of camp
    camp.addChild(goblin);

    // Position goblin at camp center
    goblin.position = { x: 0, y: 0 };

    return { camp, goblin };
}
