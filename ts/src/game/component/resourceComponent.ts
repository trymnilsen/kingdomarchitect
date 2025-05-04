import type { NaturalResource } from "../../data/inventory/items/naturalResource.js";

export type ResourceComponent = {
    id: typeof ResourceComponentId;
    resource: NaturalResource;
};

export function createResourceComponent(
    resource: NaturalResource,
): ResourceComponent {
    return {
        id: ResourceComponentId,
        resource: resource,
    };
}

export const ResourceComponentId = "Resource";
