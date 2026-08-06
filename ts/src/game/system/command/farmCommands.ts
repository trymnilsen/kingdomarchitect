import { log } from "../../../common/logging/logger.ts";
import type { SetFarmCropCommand } from "../../../server/message/command/setFarmCropCommand.ts";
import { FarmComponentId, FarmState } from "../../component/farmComponent.ts";
import type { Entity } from "../../entity/entity.ts";

export function setFarmCrop(root: Entity, command: SetFarmCropCommand) {
    const building = root.findEntity(command.building);
    if (!building) {
        log.warn("Building not found for SetFarmCrop", {
            building: command.building,
        });
        return;
    }

    const farmComponent = building.getEcsComponent(FarmComponentId);
    if (!farmComponent) {
        log.warn("Building has no farm component for SetFarmCrop", {
            building: command.building,
        });
        return;
    }

    // A planted crop is committed until harvested, so the yield always matches
    // what was sown. Only a fallow farm may have its crop reconfigured.
    if (farmComponent.state !== FarmState.Empty) {
        log.warn("Cannot change crop while farm is not fallow", {
            building: command.building,
            state: farmComponent.state,
        });
        return;
    }

    farmComponent.cropId = command.cropId;
    building.invalidateComponent(FarmComponentId);
}
