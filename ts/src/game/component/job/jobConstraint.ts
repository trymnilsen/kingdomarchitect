import { JSONValue } from "../../../common/object.js";
import { Entity } from "../../entity/entity.js";
import { WorkerBehaviorComponent } from "../behavior/workerBehaviorComponent.js";
import { Job } from "./job.js";

export function isJobApplicableForEntity(
    job: Job,
    constraint: JobConstraint,
    entity: Entity
): boolean {
    const validator = constraints[constraint.key];
    if (!validator) {
        throw new Error(
            `Unable to find constraint with key: ${constraint.key}`
        );
    }

    const isApplicable = validator(job, entity, constraint.value as any);
    return isApplicable;
}

export type JobConstraint = {
    key: JobConstraintNames;
    value: JSONValue;
};

export function entityInstanceConstraint(entityId: string) {
    return jobConstraint("entityInstance", entityId);
}

export function workerConstraint() {
    return jobConstraint("workerConstraint", undefined);
}

const entityInstanceConstraintValidator = (
    job: Job,
    entity: Entity,
    data: string
) => {
    return entity.id === data;
};

const workerConstraintValidator = (job: Job, entity: Entity) => {
    return !!entity.getComponent(WorkerBehaviorComponent);
};

const constraints = {
    entityInstance: entityInstanceConstraintValidator,
    workerConstraint: workerConstraintValidator,
} as const;

type JobConstraintNames = keyof typeof constraints;
type JobConstraintsMap = {
    [P in keyof typeof constraints]: {
        key: P;
        value: Parameters<(typeof constraints)[P]>[2];
    };
};

function jobConstraint(
    constraintName: JobConstraintNames,
    data: JobConstraintsMap[typeof constraintName]["value"]
): JobConstraint {
    return {
        value: data as JSONValue,
        key: constraintName,
    };
}
