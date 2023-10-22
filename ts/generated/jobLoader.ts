import { ConstructorFunction } from "../src/common/constructor.js";
import { Job } from "../src/game/component/job/job.js";
import { LookForFoodJob } from "../src/game/component/actor/mob/LookForFoodJob.js";
import { AttackJob } from "../src/game/component/actor/mob/attackJob.js";
import { BuildJob } from "../src/game/component/job/jobs/buildJob.js";
import { CollectChestJob } from "../src/game/component/job/jobs/chest/collectChestJob.js";
import { ChopTreeJob } from "../src/game/component/job/jobs/chopTreeJob.js";
import { MoveJob } from "../src/game/component/job/jobs/moveJob.js";

export const jobLoaders: ConstructorFunction<Job>[] = [
    LookForFoodJob,
    AttackJob,
    BuildJob,
    CollectChestJob,
    ChopTreeJob,
    MoveJob,
];
