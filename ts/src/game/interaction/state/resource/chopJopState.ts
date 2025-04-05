import { sprites2 } from "../../../../module/asset/sprite.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../module/ui/uiSize.js";
import { Entity } from "../../../entity/entity.js";
import { GroundTile } from "../../../../module/map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { BoxSelectionMode } from "../../selection/boxSelectionMode.js";
import { LineSelectionMode } from "../../selection/lineSelectionMode.js";
import { SelectionMode } from "../../selection/selectionMode.js";
import { SingleSelectionMode } from "../../selection/singleSelectionMode.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";

export class ChopJobState extends InteractionState {
    private chopMode: SelectionMode;

    override get stateName(): string {
        return "Chop tree";
    }

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

    override onDraw(context: RenderScope): void {
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
        let hadTreeInSelection = false;
        for (const point of this.chopMode.getSelection()) {
            //TODO: Reimplement chop, maybe a "collect resource" state?
            const treeEntity = null;
            /*
            this.context.root
                .requireComponent(SpatialChunkMapComponent)
                .getEntitiesAt(point.x, point.y)
                .find((entity) => entity.getComponent(TreeComponent));
            */
            if (!treeEntity) {
                continue;
            }

            const treeComponent = null;
            //treeEntity.getComponent(TreeComponent);

            if (!treeComponent) {
                continue;
            }

            hadTreeInSelection = true;

            /*
            this.context.root
                .requireComponent(JobQueueComponent)
                .addJob(new ChopTreeJob(treeEntity));
                */
        }

        if (hadTreeInSelection) {
            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "No tree selected"),
            );
        }
    }
}
