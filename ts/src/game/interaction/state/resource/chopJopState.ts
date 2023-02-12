import { RenderContext } from "../../../../rendering/renderContext";
import { ChopTreeJob } from "../../../world/actor/jobs/chopTreeJob";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";

export class ChopJobState extends InteractionState {
    constructor(private selection: SelectedWorldItem) {
        super();
    }

    override onActive(): void {
        const actions = this.getActions();

        this.view = getActionbarView(actions, (action) => {
            this.actionButtonPressed(action.id);
        });
    }

    override onDraw(context: RenderContext): void {
        let cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selection.tilePosition.x,
            y: this.selection.tilePosition.y,
        });

        context.drawImage({
            image: "cursor",
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2,
        });

        super.onDraw(context);
    }

    private getActions(): ActionButton[] {
        //Check if there is a job active on the tile
        // TODO: add query back in
        const job = null;
        /*this.context.world.actors.queryJob(
            new JobByGroundTileQuery(this.selection.tile)
        );*/
        if (!!job) {
            return [
                {
                    name: "Abort",
                    id: "abort",
                },
                {
                    name: "Prioritise",
                    id: "prioritise",
                },
                {
                    name: "Cancel",
                    id: "cancel",
                },
            ];
        } else {
            //There was not job so return actions for confirming
            //the job
            return [
                {
                    name: "Confirm",
                    id: "confirm",
                },
                {
                    name: "Cancel",
                    id: "cancel",
                },
            ];
        }
    }

    private actionButtonPressed(id: string) {
        if (id == "cancel") {
            this.context.stateChanger.pop(null);
        } else if (id == "confirm") {
            console.log("Schedule chop tree job");
            this.context.world.jobQueue.schedule(
                new ChopTreeJob(this.selection)
            );

            console.log("Clear state changer job");
            this.context.stateChanger.clear();
        } else if (id == "abort") {
            //TODO: Add this back in
            /*const job = this.context.world.actors.queryJob(
                new JobByGroundTileQuery(this.selection.tile)
            );
            if (!!job) {
                job.abort();
            }*/
            this.context.stateChanger.clear();
        }
    }
}
