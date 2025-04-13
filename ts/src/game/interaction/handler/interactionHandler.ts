import { AssetLoader } from "../../../module/asset/loader/assetLoader.js";
import { sprites2 } from "../../../module/asset/sprite.js";
import { Point } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import { GameTime } from "../../../common/time.js";
import {
    InputAction,
    InputActionType,
} from "../../../module/input/inputAction.js";
import { OnTapEndEvent } from "../../../module/input/touchInput.js";
import { Camera } from "../../../rendering/camera.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { subTitleTextStyle } from "../../../rendering/text/textStyle.js";
import { bookInkColor } from "../../../module/ui/color.js";
import { UIView } from "../../../module/ui/uiView.js";
import { Entity } from "../../entity/entity.js";
import { SelectedEntityItem } from "../../../module/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../module/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../module/selection/selectedWorldItem.js";
import { SelectionState } from "../state/selection/selectionState.js";
import { InteractionHandlerStatusbarPresenter } from "./interactionHandlerStatusbarPresenter.js";
import { CommitableInteractionStateChanger } from "./interactionStateChanger.js";
import { InteractionStateHistory } from "./interactionStateHistory.js";
import { StateContext } from "./stateContext.js";
import { TileComponent } from "../../component/tileComponent.js";
import { ChunkMapComponent } from "../../component/chunkMapComponent.js";

/**
 * The interactionHandler recieves input taps and forward them to the currently
 * active state. It also handles the transition and history of states.
 */
export class InteractionHandler {
    private camera: Camera;
    private world: Entity;
    private interactionStateChanger: CommitableInteractionStateChanger;
    private history: InteractionStateHistory;
    private stateContext: StateContext;
    private statusbar: InteractionHandlerStatusbarPresenter;

    constructor(
        world: Entity,
        camera: Camera,
        assets: AssetLoader,
        time: GameTime,
        visibilityChange: () => void,
    ) {
        this.statusbar = new InteractionHandlerStatusbarPresenter(
            "state name",
            () => {
                visibilityChange();
            },
        );
        this.interactionStateChanger = new CommitableInteractionStateChanger();
        this.world = world;
        this.camera = camera;
        this.stateContext = {
            root: this.world,
            assets: assets,
            stateChanger: this.interactionStateChanger,
            gameTime: time,
            camera: camera,
        };
        this.history = new InteractionStateHistory(this.stateContext);
    }

    onTapDown(screenPoint: Point): boolean {
        //Check for statusbar tap
        const statusbarHandledTap = this.statusbar.rootView.dispatchUIEvent({
            type: "tapStart",
            position: screenPoint,
        });

        if (statusbarHandledTap) {
            return true;
        }

        const state = this.history.state;
        const stateHandledTap = state.dispatchUIEvent({
            type: "tapStart",
            position: screenPoint,
        });
        //If the tap was not handled but the state is a modal it is still
        //considered handled by the handler. so that tapping the faded overlay
        //pops the state
        if (!stateHandledTap && state.isModal) {
            return true;
        } else {
            return stateHandledTap;
        }
    }

    onTapUp(tapUpEvent: OnTapEndEvent): void {
        const screenPoint = tapUpEvent.position;
        this.statusbar.rootView.dispatchUIEvent({
            type: "tapUp",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        const statusbarTapResult = this.statusbar.rootView.dispatchUIEvent({
            type: "tap",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        if (statusbarTapResult) {
            return;
        }

        const currentState = this.history.state;
        //We dispatch two events as they are handled differently when it comes
        //to applicability. `tap` requires both position and startposition to
        //be withing the bounds. `tapUp` requires only startposition. A view
        //should also be able to handle one without affecting the other
        currentState.dispatchUIEvent({
            type: "tapUp",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        let onTapResult = currentState.dispatchUIEvent({
            type: "tap",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        const worldPosition = this.camera.screenToWorld(screenPoint);
        // Check if the tap is handled by the state if its ignored by the view
        if (!onTapResult) {
            onTapResult = currentState.onTap(screenPoint, worldPosition);
        }
        // If the tap was not handled in the ui or by the state itself
        // We will now check for either of the following:

        // - The state is modal in which case this is considered a tap on the
        // scrim and we should take the tap as a dismis
        // - The state should check if there is a tile at the world position
        // of the tap
        if (!onTapResult && !tapUpEvent.wasDragging) {
            if (currentState.isModal) {
                // if the tap was not handled and the current route is a modal
                // route we pop the state
                console.log("Tap was not handled by modal route, popping");
                this.history.pop();
                // Return to stop handling the tap more
                return;
            }

            const tilePosition =
                this.camera.worldSpaceToTileSpace(worldPosition);

            // Check if a tile was clicked at this position
            const tile = this.world
                .getEcsComponent(TileComponent)
                ?.getTile(tilePosition);

            if (tile) {
                const tileTapHandled = currentState.onTileTap(tile);

                if (!tileTapHandled) {
                    console.log(
                        "Tap not handled by state, checking for selection",
                    );
                    /*
                    const selectionState = pickSelectionState(
                        tile,
                        this.stateContext,
                    );*/

                    const entitiesAt = this.stateContext.root
                        .requireEcsComponent(ChunkMapComponent)
                        .getEntitiesAt(tile.tileX, tile.tileY);

                    let selection: SelectedWorldItem;
                    if (entitiesAt.length > 0) {
                        const entity = entitiesAt[0];
                        selection = new SelectedEntityItem(entity);
                    } else {
                        //There was not entity at this place but we can still do
                        //a check against tiles. E.g for building
                        selection = new SelectedTileItem(tile);
                    }

                    const selectionState = new SelectionState(selection);
                    if (this.history.size == 1) {
                        this.interactionStateChanger.push(selectionState);
                    } else {
                        this.interactionStateChanger.replace(selectionState);
                    }
                }
            } else {
                // Tap was not handled and we did not tap a tile
                this.interactionStateChanger.clear();
            }
        }

        this.interactionStateChanger.apply(this.history);
    }

    onTapPan(movement: Point, position: Point, startPosition: Point): void {
        this.history.state.onTapPan(movement, position, startPosition);
    }

    onInput(inputAction: InputAction) {
        const inputHandled = this.history.state.onInput(
            inputAction,
            this.interactionStateChanger,
        );

        if (
            !inputHandled &&
            inputAction.action == InputActionType.BACK_PRESS &&
            !this.interactionStateChanger.hasOperations
        ) {
            this.interactionStateChanger.pop(undefined);
        }
        this.interactionStateChanger.apply(this.history);
    }

    onUpdate(tick: number) {
        this.history.state.onUpdate(tick);
    }

    onDraw(renderScope: RenderScope) {
        if (this.history.state.isModal) {
            renderScope.drawScreenSpaceRectangle({
                x: 0,
                y: 0,
                width: renderScope.width,
                height: renderScope.height,
                fill: "rgba(20, 20, 20, 0.8)",
            });
        }

        this.history.state.onDraw(renderScope);

        /*
        if (this.history.size > 1) {
            this.statusbar.rootView.layout(renderScope, {
                width: renderScope.width,
                height: renderScope.height,
            });
            this.statusbar.rootView.updateTransform();
            this.statusbar.rootView.draw(renderScope);
        }*/
    }
}
