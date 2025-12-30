export type WorkplaceComponent = {
    id: typeof WorkplaceComponentId;
    workers: string[];
};

export function createWorkplaceComponent(): WorkplaceComponent {
    return {
        id: WorkplaceComponentId,
        workers: [],
    };
}

export const WorkplaceComponentId = "workplace";
