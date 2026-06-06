import type { Entity } from "../../../game/entity/entity.ts";
import type { CropId } from "../../../data/crop/cropDefinitions.ts";

export type SetFarmCropCommand = {
    id: typeof SetFarmCropCommandId;
    building: string;
    cropId: CropId;
};

export function SetFarmCropCommand(
    building: Entity,
    cropId: CropId,
): SetFarmCropCommand {
    return {
        id: SetFarmCropCommandId,
        building: building.id,
        cropId,
    };
}

export const SetFarmCropCommandId = "setFarmCrop";
