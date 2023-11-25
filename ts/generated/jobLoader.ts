import { ConstructorFunction } from "../src/common/constructor.js"
import { Job } from "../src/game/component/job/job.js"
import { AttackJob } from "../src/game/component/actor/mob/attackJob.js";
import { BuildJob } from "../src/game/component/job/jobs/buildJob.js";
import { ChopTreeJob } from "../src/game/component/job/jobs/chopTreeJob.js";
import { CollectChestJob } from "../src/game/component/job/jobs/chest/collectChestJob.js";
import { LookForFoodJob } from "../src/game/component/actor/mob/LookForFoodJob.js";
import { MoveJob } from "../src/game/component/job/jobs/moveJob.js";

export const jobLoaders: ConstructorFunction<Job>[] = [
    AttackJob,
    BuildJob,
    ChopTreeJob,
    CollectChestJob,
    LookForFoodJob,
    MoveJob,
];
