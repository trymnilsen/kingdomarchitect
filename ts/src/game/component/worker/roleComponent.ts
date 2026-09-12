export const WorkerRole = {
    Worker: 0,
    Explorer: 1,
    Guard: 2,
    Devotee: 3,
    Spy: 4,
    Envoy: 5,
    Trader: 6,
    Hauler: 7,
} as const;

export type WorkerRole = (typeof WorkerRole)[keyof typeof WorkerRole];

/** Every role in book order. A worker's own order is a permutation of this. */
export const allWorkerRoles: readonly WorkerRole[] = [
    WorkerRole.Worker,
    WorkerRole.Explorer,
    WorkerRole.Guard,
    WorkerRole.Devotee,
    WorkerRole.Spy,
    WorkerRole.Envoy,
    WorkerRole.Trader,
    WorkerRole.Hauler,
];

export const WorkerStance = {
    Defensive: 0,
    Aggressive: 1,
} as const;

export type WorkerStance = (typeof WorkerStance)[keyof typeof WorkerStance];

export type RoleComponent = {
    id: typeof RoleComponentId;
    /** Every WorkerRole exactly once, most preferred first. Index is rank. */
    dutyPriority: WorkerRole[];
    /** How many leading entries the worker performs. The rest report invalid. */
    permittedDutyCount: number;
    stance: WorkerStance;
};

/**
 * A fresh worker works and hauls. Hauling by default keeps ground piles from
 * sitting there until the player thinks to staff a hauler.
 */
export function createRoleComponent(): RoleComponent {
    return {
        id: RoleComponentId,
        dutyPriority: [
            WorkerRole.Worker,
            WorkerRole.Hauler,
            WorkerRole.Explorer,
            WorkerRole.Guard,
            WorkerRole.Devotee,
            WorkerRole.Spy,
            WorkerRole.Envoy,
            WorkerRole.Trader,
        ],
        permittedDutyCount: 2,
        stance: WorkerStance.Defensive,
    };
}

export const RoleComponentId = "role";
