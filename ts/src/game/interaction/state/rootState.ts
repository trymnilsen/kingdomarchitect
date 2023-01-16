import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../world/tile/ground";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";
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

    override onDraw(context: RenderContext): void {
        context.drawScreenSpaceRectangle({
            x: 16,
            y: 16,
            width: 32,
            height: 32,
            fill: "blue",
        });
    }
}
