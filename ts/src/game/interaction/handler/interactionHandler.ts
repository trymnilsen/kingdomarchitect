import { Point } from "../../../common/point.js";
import { GameTime } from "../../../common/time.js";
import { AssetLoader } from "../../../module/asset/loader/assetLoader.js";
import {
    InputAction,
    InputActionType,
} from "../../../module/input/inputAction.js";
import { OnTapEndEvent } from "../../../module/input/touchInput.js";
import { SelectedEntityItem } from "../../../module/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../module/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../module/selection/selectedWorldItem.js";
import type { UiRenderer } from "../../../module/ui/declarative/ui.js";
import { Camera } from "../../../rendering/camera.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../component/chunkMapComponent.js";
import { getTile, TileComponentId } from "../../component/tileComponent.js";
import { Entity } from "../../entity/entity.js";
import { SelectionState } from "../state/selection/selectionState.js";
import { CommitableInteractionStateChanger } from "./interactionStateChanger.js";
import { InteractionStateHistory } from "./interactionStateHistory.js";
import { StateContext } from "./stateContext.js";

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
    private uiRenderer: UiRenderer;
    constructor(
        world: Entity,
        camera: Camera,
        assets: AssetLoader,
        time: GameTime,
        uiRenderer: UiRenderer,
        _visibilityChange: () => void,
    ) {
        this.uiRenderer = uiRenderer;
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
        // Try to dispatch to the declarative UI system
        const declarativeEvent = {
            type: "tapDown" as const,
            position: screenPoint,
            timestamp: Date.now(),
        };

        const declarativeHandled =
            this.uiRenderer.dispatchUIEvent(declarativeEvent);
        if (declarativeHandled) {
            return true;
        }

        // Old imperative system - commented out for future removal
        // const state = this.history.state;
        // const stateHandledTap = state.dispatchUIEvent({
        //     type: "tapStart",
        //     position: screenPoint,
        // });
        // if (!stateHandledTap && state.isModal) {
        //     return true;
        // } else {
        //     return stateHandledTap;
        // }

        const state = this.history.state;
        //If the tap was not handled but the state is a modal it is still
        //considered handled by the handler. so that tapping the faded overlay
        //pops the state
        if (state.isModal) {
            return true;
        } else {
            return false;
        }
    }

    onTapUp(tapUpEvent: OnTapEndEvent): void {
        const screenPoint = tapUpEvent.position;

        // Route events directly to declarative UI system
        const declarativeUpEvent = {
            type: "tapUp" as const,
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
            timestamp: Date.now(),
        };

        const declarativeTapEvent = {
            type: "tap" as const,
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
            timestamp: Date.now(),
        };

        // Dispatch tapUp first
        const declarativeUpHandled =
            this.uiRenderer.dispatchUIEvent(declarativeUpEvent);

        // Then dispatch tap event
        let onTapResult = this.uiRenderer.dispatchUIEvent(declarativeTapEvent);

        // Old imperative system - commented out for future removal
        // if (!declarativeUpHandled && !onTapResult) {
        //     const currentState = this.history.state;
        //     currentState.dispatchUIEvent({
        //         type: "tapUp",
        //         position: screenPoint,
        //         startPosition: tapUpEvent.startPosition,
        //     });
        //
        //     onTapResult = currentState.dispatchUIEvent({
        //         type: "tap",
        //         position: screenPoint,
        //         startPosition: tapUpEvent.startPosition,
        //     });
        //
        //     const worldPosition = this.camera.screenToWorld(screenPoint);
        //     if (!onTapResult) {
        //         onTapResult = currentState.onTap(screenPoint, worldPosition);
        //     }
        // }

        const worldPosition = this.camera.screenToWorld(screenPoint);
        const currentState = this.history.state;

        // If declarative UI didn't handle it, check if state can handle it
        if (!declarativeUpHandled && !onTapResult) {
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
            const tileComponent =
                this.world.requireEcsComponent(TileComponentId);

            const tile = getTile(tileComponent, tilePosition);

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
                    const chunkMap =
                        this.stateContext.root.requireEcsComponent(
                            ChunkMapComponentId,
                        );

                    const entitiesAt = getEntitiesAt(
                        chunkMap,
                        tile.tileX,
                        tile.tileY,
                    );

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
        //const start = performance.now();
        performance.mark("InteractionStateDraw");
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
        this.uiRenderer.renderComponent(this.history.state.getView());

        performance.mark("InteractionStateDrawEnd");
        performance.measure(
            "UI Drawing",
            "InteractionStateDraw",
            "InteractionStateDrawEnd",
        );
        //console.log("Interaction state draw", performance.now() - start);
    }
}
