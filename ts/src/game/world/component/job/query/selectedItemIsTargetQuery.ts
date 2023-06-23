import { Job } from "../../../job/job.js";
import { ChopTreeJob } from "../../../job/jobs/chopTreeJob.js";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../selection/selectedWorldItem.js";
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
                return this.selection.isSelectedItem(selection.entity);
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
