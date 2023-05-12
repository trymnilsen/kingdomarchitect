import { sprites2 } from "../../../../asset/sprite";
import { allSides } from "../../../../common/sides";
import { InputAction } from "../../../../input/inputAction";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize } from "../../../../ui/uiSize";
import { WorkerBehaviorComponent } from "../../../world/component/behavior/workerBehaviorComponent";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { GroundTile } from "../../../world/tile/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { AlertMessageState } from "../common/alertMessageState";
import { LandUnlockState } from "../land/landUnlockState";
import { ActorSelectionState } from "../selection/actorSelectionState";
import { SelectionState } from "../selection/selectionState";
import { BuildingState } from "./building/buildingState";
import { InventoryState } from "./inventory/inventoryState";
import { UITimeline } from "./ui/uiTimeline";

export class RootState extends InteractionState {
    override onActive(): void {
        super.onActive();

        const actionItems: UIActionbarItem[] = [
            {
                text: "Build",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new BuildingState());
                },
            },
            {
                text: "Land",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new LandUnlockState());
                },
            },
            {
                text: "Stash",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new InventoryState());
                },
            },
            {
                text: "Quest",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Oh no", "Not implemented")
                    );
                },
            },
        ];

        const timeline = new UITimeline(this.context.gameTime, {
            width: fillUiSize,
            height: 48,
        });

        const leftActionbar = new UIActionbar(
            actionItems,
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
            padding: allSides(16),
            alignment: uiAlignment.topCenter,
            children: [timeline],
        });

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }

    override onTileTap(tile: GroundTile): boolean {
        console.log("RootState tap: ", tile);
        let selection: SelectedWorldItem = new SelectedTileItem(tile);
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
            x: tile.tileX,
            y: tile.tileY,
        });
        if (entitiesAt.length > 0) {
            const actor = entitiesAt[0];
            const behavior = actor.getComponent(WorkerBehaviorComponent);
            if (behavior) {
                this.context.stateChanger.push(new ActorSelectionState(actor));
            } else {
                selection = new SelectedEntityItem(entitiesAt[0]);
                this.context.stateChanger.push(new SelectionState(selection));
            }
        } else {
            if (tile.hasTree) {
                this.context.stateChanger.push(new SelectionState(selection));
            }
        }

        return true;
    }

    override onInput(
        input: InputAction,
        stateChanger: InteractionStateChanger
    ): boolean {
        return false;
    }
}
