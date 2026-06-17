import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { StockpileComponentId } from "../../../../../component/stockpileComponent.ts";
import {
    StationComponentId,
    StationPriority,
} from "../../../../../component/stationComponent.ts";
import { WatchComponentId } from "../../../../../component/watchComponent.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import type { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import type { Entity } from "../../../../../entity/entity.ts";
import type { StateContext } from "../../../../handler/stateContext.ts";
import type { ButtonCollection } from "../../../../view/buttonCollection.ts";
import type { UIActionbarItem } from "../../../../view/uiActionbar.ts";
import type { ActorSelectionProvider } from "./actorSelectionProvider.ts";
import { emptySelection } from "./actorSelectionProvider.ts";
import { StockpileState } from "../../../stockpile/stockpileState.ts";
import { SetStationPriorityCommand } from "../../../../../../server/message/command/setStationPriorityCommand.ts";
import { SetSearchlightModeCommand } from "../../../../../../server/message/command/setSearchlightModeCommand.ts";

export class BuildingSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const entity = selection.entity;
        const left: UIActionbarItem[] = [];

        if (entity.getEcsComponent(StockpileComponentId)) {
            left.push(
                {
                    text: "Ledger",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new StockpileState(entity, 0),
                        );
                    },
                },
                {
                    text: "Preferred",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new StockpileState(entity, 1),
                        );
                    },
                },
            );
        }

        if (entity.getEcsComponent(StationComponentId)) {
            left.push(this.garrisonButton(stateContext, entity));
        }
        if (entity.getEcsComponent(WatchComponentId)) {
            left.push(this.searchlightButton(stateContext, entity));
        }

        if (left.length === 0) {
            return emptySelection;
        }
        return { left, right: [] };
    }

    /** Sets the tower's garrison priority — which towers guards prefer to man. */
    private garrisonButton(
        stateContext: StateContext,
        tower: Entity,
    ): UIActionbarItem {
        const setPriority = (priority: StationPriority) => () => {
            stateContext.commandDispatcher(
                SetStationPriorityCommand(tower, priority),
            );
        };
        return {
            text: "Garrison",
            icon: spriteRefs.empty_sprite,
            children: [
                {
                    text: "Off",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPriority(StationPriority.Off),
                },
                {
                    text: "Low",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPriority(StationPriority.Low),
                },
                {
                    text: "Medium",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPriority(StationPriority.Medium),
                },
                {
                    text: "High",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPriority(StationPriority.High),
                },
            ],
        };
    }

    /** Sets the night searchlight aim: auto-sweep or a fixed cardinal quarter. */
    private searchlightButton(
        stateContext: StateContext,
        tower: Entity,
    ): UIActionbarItem {
        const setMode = (mode: "auto" | "N" | "E" | "S" | "W") => () => {
            stateContext.commandDispatcher(
                SetSearchlightModeCommand(tower, mode),
            );
        };
        return {
            text: "Searchlight",
            icon: spriteRefs.empty_sprite,
            children: [
                {
                    text: "Auto",
                    icon: spriteRefs.empty_sprite,
                    onClick: setMode("auto"),
                },
                {
                    text: "North",
                    icon: spriteRefs.empty_sprite,
                    onClick: setMode("N"),
                },
                {
                    text: "East",
                    icon: spriteRefs.empty_sprite,
                    onClick: setMode("E"),
                },
                {
                    text: "South",
                    icon: spriteRefs.empty_sprite,
                    onClick: setMode("S"),
                },
                {
                    text: "West",
                    icon: spriteRefs.empty_sprite,
                    onClick: setMode("W"),
                },
            ],
        };
    }
}
