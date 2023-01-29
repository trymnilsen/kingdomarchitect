import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../world/tile/ground";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";
import { ActionButton, getActionbarView } from "../view/actionbar";
import { InventoryState } from "./inventory/inventoryState";
import { LandUnlockState } from "./land/landUnlockState";
import { ActorSelectedItem, TileSelectedItem } from "./selection/selectedItem";
import { SelectionState } from "./selection/selectionState";

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

        const actionbarView = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });

        this.view = actionbarView;
    }

    override onTileTap(tile: GroundTile): boolean {
        console.log("RootState tap: ", tile);
        const actor = null;
        //TODO: add back actor selector
        /*this.context.world.actors.getActor({
            x: tile.tileX,
            y: tile.tileY,
        });*/

        if (!!actor) {
            const actorSelection = new ActorSelectedItem(actor);
            this.context.stateChanger.push(new SelectionState(actorSelection));
        } else {
            const tileSelection = new TileSelectedItem(tile);
            this.context.stateChanger.push(new SelectionState(tileSelection));
        }

        return true;
    }

    override onInput(
        input: InputEvent,
        stateChanger: InteractionStateChanger
    ): boolean {
        return true;
    }

    private actionSelected(action: ActionButton) {
        if (action.id == "land") {
            this.context.stateChanger.push(new LandUnlockState());
        } else if (action.id == "inventory") {
            this.context.stateChanger.push(new InventoryState());
        }
    }
}
