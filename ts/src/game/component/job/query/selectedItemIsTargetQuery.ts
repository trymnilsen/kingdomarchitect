import { SelectedEntityItem } from "../../../interaction/state/selection/item/selectedEntityItem.js";
import { SelectedTileItem } from "../../../interaction/state/selection/item/selectedTileItem.js";
import { SelectedWorldItem } from "../../../interaction/state/selection/item/selectedWorldItem.js";
import { Job } from "../job.js";
import { ChopTreeJob } from "../jobs/chopTreeJob.js";
import { JobQuery } from "./jobQuery.js";

/**
 * Queries for jobs that is targeting the given entity. This is different
 * than the entity that the job is running on.
 */
export class SelectedItemIsTargetQuery implements JobQuery {
    constructor(private selection: SelectedWorldItem) {}

    matches(job: Job): boolean {
        if (job instanceof ChopTreeJob) {
            const selection = job.target;
            if (selection instanceof SelectedEntityItem) {
                return this.selection.isSelectedItem(selection.transform);
            } else if (selection instanceof SelectedTileItem) {
                return this.selection.isSelectedItem(selection.groundTile);
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
