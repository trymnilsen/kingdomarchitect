function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { ChopTreeJob } from "../../../job/jobs/chopTreeJob.js";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../selection/selectedTileItem.js";
/**
 * Queries for jobs that is targeting the given entity. This is different
 * than the entity that the job is running on.
 */ export class SelectedItemIsTargetQuery {
    matches(job) {
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
    constructor(selection){
        _define_property(this, "selection", void 0);
        this.selection = selection;
    }
}
