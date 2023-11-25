import { JSONValue } from "../../../common/object.js";
import { PathMovement } from "./helper/movementHelper.js";
import { JobState } from "./jobState.js";

export type JobBundle<T extends JSONValue = JSONValue> = {
    data: T;
    type: string;
    jobState: JobState;
};
