import type { Job } from "./job.ts";

export interface AttackJob extends Job {
    id: typeof AttackJobId;
    target: string;
    attacker: string;
}

export function AttackJob(attacker: string, target: string): AttackJob {
    return {
        id: AttackJobId,
        target: target,
        attacker: attacker,
        constraint: {
            type: "entity",
            id: attacker,
        },
    };
}

export const AttackJobId = "attackJob";
