export type OppcupationComponent = {
    id: typeof OccupationComponentId;
    workplace?: string;
};

export function createOccupationComponent(): OppcupationComponent {
    return {
        id: OccupationComponentId,
        workplace: undefined,
    };
}

export const OccupationComponentId = "occupation";
