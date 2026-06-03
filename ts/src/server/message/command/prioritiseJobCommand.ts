export type PrioritiseJobCommand = {
    id: typeof PrioritiseJobCommandId;
    entityId: string;
};

export function PrioritiseJobCommand(entityId: string): PrioritiseJobCommand {
    return {
        id: PrioritiseJobCommandId,
        entityId,
    };
}

export const PrioritiseJobCommandId = "prioritiseJob";
