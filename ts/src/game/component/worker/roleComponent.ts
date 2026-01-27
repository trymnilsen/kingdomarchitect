export const WorkerRole = {
    Worker: 0,
    Explorer: 1,
    Guard: 2,
    Devotee: 3,
    Spy: 4,
    Envoy: 5,
    Trader: 6,
} as const;

export type WorkerRole = (typeof WorkerRole)[keyof typeof WorkerRole];

export const WorkerStance = {
    Defensive: 0,
    Aggressive: 1,
} as const;

export type WorkerStance = (typeof WorkerStance)[keyof typeof WorkerStance];

export type RoleComponent = {
    id: typeof RoleComponentId;
    role: WorkerRole;
    stance: WorkerStance;
};

export function createRoleComponent(): RoleComponent {
    return {
        id: RoleComponentId,
        role: WorkerRole.Worker,
        stance: WorkerStance.Defensive,
    };
}

export const RoleComponentId = "role";
