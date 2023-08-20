import { ConstructorFunction } from "../../../common/constructor.js";
import { LookForFoodJob } from "../actor/mob/LookForFoodJob.js";
import { AttackJob } from "../actor/mob/attackJob.js";
import { Job } from "./job.js";
import { BuildJob } from "./jobs/buildJob.js";
import { CollectChestJob } from "./jobs/chest/collectChestJob.js";
import { ChopTreeJob } from "./jobs/chopTreeJob.js";
import { MoveJob } from "./jobs/moveJob.js";

export const jobs: ConstructorFunction<Job>[] = [
    AttackJob,
    LookForFoodJob,
    CollectChestJob,
    BuildJob,
    ChopTreeJob,
    MoveJob,
];
