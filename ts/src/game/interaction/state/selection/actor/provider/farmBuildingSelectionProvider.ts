import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { FarmComponentId, FarmState } from "../../../../../component/farmComponent.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { createFarmPlantJob } from "../../../../../job/farmPlantJob.ts";
import { createFarmHarvestJob } from "../../../../../job/farmHarvestJob.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";

export class FarmBuildingSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const buildingComponent = selection.entity.getEcsComponent(BuildingComponentId);
        const farmComponent = selection.entity.getEcsComponent(FarmComponentId);

        if (!buildingComponent || !farmComponent) {
            return emptySelection;
        }

        if (farmComponent.state === FarmState.Empty) {
            return {
                left: [
                    {
                        text: "Plant",
                        icon: spriteRefs.empty_sprite,
                        onClick: () => {
                            const job = createFarmPlantJob(selection.entity.id);
                            stateContext.commandDispatcher(QueueJobCommand(job));
                        },
                    },
                ],
                right: [],
            };
        }

        if (farmComponent.state === FarmState.Growing) {
            return {
                left: [{ text: "Growing...", icon: spriteRefs.empty_sprite }],
                right: [],
            };
        }

        if (farmComponent.state === FarmState.Ready) {
            return {
                left: [
                    {
                        text: "Harvest",
                        icon: spriteRefs.empty_sprite,
                        onClick: () => {
                            const job = createFarmHarvestJob(selection.entity.id);
                            stateContext.commandDispatcher(QueueJobCommand(job));
                        },
                    },
                ],
                right: [],
            };
        }

        return emptySelection;
    }
}
