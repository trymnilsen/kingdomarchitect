export type DismantleBuildingCommand = {
    id: typeof DismantleBuildingCommandId;
    buildingId: string;
};

export function DismantleBuildingCommand(
    buildingId: string,
): DismantleBuildingCommand {
    return {
        id: DismantleBuildingCommandId,
        buildingId,
    };
}

export const DismantleBuildingCommandId = "dismantleBuilding";
