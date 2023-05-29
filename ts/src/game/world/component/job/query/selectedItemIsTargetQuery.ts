import { Job } from "../../../job/job";
import { ChopTreeJob } from "../../../job/jobs/chopTreeJob";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem";
import { SelectedTileItem } from "../../../selection/selectedTileItem";
import { SelectedWorldItem } from "../../../selection/selectedWorldItem";
import { JobQuery } from "./jobQuery";

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
