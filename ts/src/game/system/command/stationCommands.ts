import { log } from "../../../common/logging/logger.ts";
import type { SetSearchlightModeCommand } from "../../../server/message/command/setSearchlightModeCommand.ts";
import type { SetStationPriorityCommand } from "../../../server/message/command/setStationPriorityCommand.ts";
import { StationComponentId } from "../../component/stationComponent.ts";
import { WatchComponentId } from "../../component/watchComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Handlers for how a watch tower behaves once it is staffed.
 */
export function setStationPriority(
    root: Entity,
    command: SetStationPriorityCommand,
) {
    const tower = root.findEntity(command.tower);
    if (!tower) {
        log.warn("Tower not found for SetStationPriority", {
            tower: command.tower,
        });
        return;
    }

    const station = tower.getEcsComponent(StationComponentId);
    if (!station) {
        log.warn("Entity has no station component for SetStationPriority", {
            tower: command.tower,
        });
        return;
    }

    station.priority = command.priority;
    tower.invalidateComponent(StationComponentId);
}

export function setSearchlightMode(
    root: Entity,
    command: SetSearchlightModeCommand,
) {
    const tower = root.findEntity(command.tower);
    if (!tower) {
        log.warn("Tower not found for SetSearchlightMode", {
            tower: command.tower,
        });
        return;
    }

    const watch = tower.getEcsComponent(WatchComponentId);
    if (!watch) {
        log.warn("Entity has no watch component for SetSearchlightMode", {
            tower: command.tower,
        });
        return;
    }

    watch.searchlight = command.mode;
    // A fixed cardinal also sets the resolved aim immediately. "auto" lets the
    // watch system drive beamAim.
    if (command.mode !== "auto") {
        watch.beamAim = command.mode;
    }
    tower.invalidateComponent(WatchComponentId);
}
