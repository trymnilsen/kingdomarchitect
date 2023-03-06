import { InputAction, InputActionType } from "../../../../input/inputAction";
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
];

export class RootState extends InteractionState {
    /*     onTap(
        screenPosition: Point
    ): boolean {
        if (withinRectangle(screenPosition, 16, 16, 48, 48)) {
            return true;
        } else {
            return false;
        }
    } */

    override onActive(): void {
        super.onActive();

        const actionbarView = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });

        this.view = actionbarView;
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
