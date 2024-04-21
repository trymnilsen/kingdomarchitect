import { sprites2 } from "../../../../asset/sprite.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { JobQueueComponent } from "../../../component/job/jobQueueComponent.js";
import { ChopTreeJob } from "../../../component/job/jobs/chopTreeJob.js";
import { TreeComponent } from "../../../component/resource/treeComponent.js";
import { ChunkMapComponent } from "../../../component/root/chunk/chunkMapComponent.js";
import { Entity } from "../../../entity/entity.js";
import { GroundTile } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { BoxSelectionMode } from "../../selection/boxSelectionMode.js";
import { LineSelectionMode } from "../../selection/lineSelectionMode.js";
import { SelectionMode } from "../../selection/selectionMode.js";
import { SingleSelectionMode } from "../../selection/singleSelectionMode.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";

export class ChopJobState extends InteractionState {
    private chopMode: SelectionMode;

    constructor(selection: Entity) {
        super();
        this.chopMode = new SingleSelectionMode(selection.worldPosition);
    }

    override onActive(): void {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            [
                {
                    text: "Confirm",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.scheduleChop();
                    },
                },
                {
                    text: "Single",
                    icon: sprites2.empty_sprite,
                    children: [
                        {
                            text: "Single",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                this.chopMode = new SingleSelectionMode(
                                    this.chopMode.cursorSelection(),
                                );
                            },
                        },
                        {
                            text: "Line",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                this.chopMode = new LineSelectionMode(
                                    this.chopMode.cursorSelection(),
                                );
                            },
                        },
                        {
                            text: "Box",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                this.chopMode = new BoxSelectionMode(
                                    this.chopMode.cursorSelection(),
                                );
                            },
                        },
                    ],
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            [],
            { width: fillUiSize, height: fillUiSize },
        );

        this.view = scaffoldView;
    }

    override onTileTap(tile: GroundTile): boolean {
        const position = {
            x: tile.tileX,
            y: tile.tileY,
        };

        this.chopMode.setSelection(position);
        return true;
    }

    override onDraw(context: RenderContext): void {
        const selection = this.chopMode.getSelection();
        for (const cursor of selection) {
            const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
                x: cursor.x,
                y: cursor.y,
            });

            context.drawSprite({
                sprite: sprites2.cursor,
                x: cursorWorldPosition.x + 2,
                y: cursorWorldPosition.y + 2,
            });
        }

        super.onDraw(context);
    }

    private scheduleChop() {
        console.log("Schedule chop tree job");
        for (const point of this.chopMode.getSelection()) {
            const treeEntity = this.context.root
                .requireComponent(ChunkMapComponent)
                .getEntityAt(point)
                .find((entity) => entity.getComponent(TreeComponent));

            if (!treeEntity) {
                continue;
            }

            const treeComponent = treeEntity.getComponent(TreeComponent);

            if (!treeComponent) {
                continue;
            }

            this.context.root
                .requireComponent(JobQueueComponent)
                .addJob(new ChopTreeJob(treeEntity));
        }

        console.log("Clear state changer job");
        this.context.stateChanger.clear();
    }
}
