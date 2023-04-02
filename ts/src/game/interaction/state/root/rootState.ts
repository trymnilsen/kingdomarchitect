import { sprites2 } from "../../../../asset/sprite";
import { allSides } from "../../../../common/sides";
import { InputAction, InputActionType } from "../../../../input/inputAction";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { spriteImageSource, uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiRow } from "../../../../ui/dsl/uiRowDsl";
import { uiSpace } from "../../../../ui/dsl/uiSpaceDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { GroundTile } from "../../../world/tile/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { LandUnlockState } from "../land/landUnlockState";
import { SelectionState } from "../selection/selectionState";
import { BuildingState } from "./building/buildingState";
import { InventoryState } from "./inventory/inventoryState";
import { UITimeline } from "./ui/uiTimeline";

const actions: ActionButton[] = [
    {
        id: "build",
        name: "Build",
    },
    {
        id: "land",
        name: "Land",
    },
    {
        id: "inventory",
        name: "Inventory",
    },
    {
        id: "quest",
        name: "Quest",
    },
];

export class RootState extends InteractionState {
    override onActive(): void {
        super.onActive();

        const actionbarView = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });

        const timeline = new UITimeline(this.context.gameTime, {
            width: fillUiSize,
            height: 48,
        });

        const timelineControls = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(16),
            alignment: uiAlignment.topCenter,
            children: [timeline],
        });

        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            children: [actionbarView, timelineControls],
        });
    }

    override onTileTap(tile: GroundTile): boolean {
        console.log("RootState tap: ", tile);
        let selection: SelectedWorldItem = new SelectedTileItem(tile);
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
            x: tile.tileX,
            y: tile.tileY,
        });
        if (entitiesAt.length > 0) {
            selection = new SelectedEntityItem(entitiesAt[0]);
        }

        this.context.stateChanger.push(new SelectionState(selection));

        return true;
    }

    override onInput(
        input: InputAction,
        stateChanger: InteractionStateChanger
    ): boolean {
        if (input.action == InputActionType.NUMBER_PRESS) {
            const number = parseInt(input.value) - 1;
            if (number >= 0 && number < actions.length) {
                const action = actions[number];
                this.actionSelected(action);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private actionSelected(action: ActionButton) {
        if (action.id == "land") {
            this.context.stateChanger.push(new LandUnlockState());
        } else if (action.id == "inventory") {
            this.context.stateChanger.push(new InventoryState());
        } else if (action.id == "build") {
            this.context.stateChanger.push(new BuildingState());
        }
    }
}
