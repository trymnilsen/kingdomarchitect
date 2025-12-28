export type ResourceComponent = {
    id: typeof ResourceComponentId;
    resourceId: string;
};

export function createResourceComponent(resourceId: string): ResourceComponent {
    return {
        id: ResourceComponentId,
        resourceId,
    };
}

export const ResourceComponentId = "Resource";
