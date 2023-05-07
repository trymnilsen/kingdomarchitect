import { sprites2 } from "../../../../asset/sprite";
import { allSides } from "../../../../common/sides";
import { RenderContext } from "../../../../rendering/renderContext";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize } from "../../../../ui/uiSize";
import { WorkerBehaviorComponent } from "../../../world/component/behavior/workerBehaviorComponent";
import { ChestComponent } from "../../../world/component/resource/chestComponent";
import { TreeComponent } from "../../../world/component/resource/treeComponent";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { CharacterSkillState } from "../character/characterSkillState";
import { ChopJobState } from "../resource/chopJopState";
import { CollectChestState } from "../resource/collectChestState";

export class SelectionState extends InteractionState {
    private selectedItem: SelectedWorldItem;

    constructor(selection: SelectedWorldItem) {
        super();
        this.selectedItem = selection;
    }

    override onActive(): void {
        this.updateTileActions();
    }

    /* 
    onTap(screenPosition: Point): boolean {
        if (this.actionbar) {
            const hitResult = onTapLayout(this.actionbar, screenPosition);
            if (!hitResult.handled) {
                //If the tap was not in our layout return false early
                return false;
            }
        }

        if (stateChanger.hasOperations) {
            return true;
        } else {
            return false;
        }
    } */

    override onTileTap(tile: GroundTile): boolean {
        // If a new tile was tapped while in this state we move the cursor to it
        console.log("TileSelectedState - onTileTap: ", tile);
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
            x: tile.tileX,
            y: tile.tileY,
        });
        if (entitiesAt.length > 0) {
            this.selectedItem = new SelectedEntityItem(entitiesAt[0]);
        } else {
            this.selectedItem = new SelectedTileItem(tile);
        }
        console.log("Selection updated: ", this.selectedItem);

        this.updateTileActions();
        return true;
    }

    override onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.selectedItem.tilePosition
        );
        const bounds = this.selectedItem.selectionSize;
        const cursorWidth = bounds.x * TileSize;
        const cursorHeight = bounds.y * TileSize;

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: cursorHeight,
            width: cursorWidth,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });

        super.onDraw(context);
    }

    private updateTileActions() {
        const actions = this.getTileActions(this.selectedItem);
        const leftActionbar = new UIActionbar(
            actions,
            new SpriteBackground(sprites2.stone_slate_background_2x),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    private getTileActions(selection: SelectedWorldItem): UIActionbarItem[] {
        if (selection instanceof SelectedEntityItem) {
            let actions: UIActionbarItem[] = [];
            const tree = selection.entity.getComponent(TreeComponent);
            if (!!tree) {
                actions = [
                    {
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: () => {
                            this.onChopSelected();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            const worker = selection.entity.getComponent(
                WorkerBehaviorComponent
            );

            if (!!worker) {
                actions = [
                    {
                        icon: sprites2.empty_sprite,
                        text: "Skills",
                        onClick: () => {
                            this.onSkills();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            const chest = selection.entity.getComponent(ChestComponent);

            if (!!chest) {
                actions = [
                    {
                        text: "Collect",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            this.onCollect();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            return actions;
        } else if (selection instanceof SelectedTileItem) {
            const tile = this.context.world.ground.getTile(
                selection.tilePosition
            );
            let actions: UIActionbarItem[] = [];
            if (tile && tile.hasTree) {
                actions = [
                    {
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: () => {
                            this.onChopSelected();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            return actions;
        } else {
            return [
                {
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: () => {
                        this.onCancel();
                    },
                },
            ];
        }
    }

    private onChopSelected() {
        const selectedTile = this.selectedItem;
        this.context.stateChanger.push(new ChopJobState(selectedTile));
    }

    private onCancel() {
        this.context.stateChanger.pop(null);
    }

    private onSkills() {
        this.context.stateChanger.push(new CharacterSkillState());
    }

    private onCollect() {
        if (this.selectedItem instanceof SelectedEntityItem) {
            const chest = this.selectedItem.entity.getComponent(ChestComponent);

            if (!chest) {
                throw new Error("No chest component found");
            }

            this.context.stateChanger.push(new CollectChestState(chest));
        }
    }
}
