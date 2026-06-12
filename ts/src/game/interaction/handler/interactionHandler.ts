import { type Point } from "../../../common/point.ts";
import { GameTime } from "../../../common/time.ts";
import { AssetLoader } from "../../../asset/loader/assetLoader.ts";
import { type InputAction, InputActionType } from "../../../input/inputAction.ts";
import { type OnTapEndEvent } from "../../../input/touchInput.ts";
import { SelectedEntityItem } from "../selection/selectedEntityItem.ts";
import { SelectedTileItem } from "../selection/selectedTileItem.ts";
import { type SelectedWorldItem } from "../selection/selectedWorldItem.ts";
import type {
    ComponentDescriptor,
    UiRenderer,
} from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiColumn } from "../../../ui/declarative/uiSequence.ts";
import { uiScrim } from "../../../ui/declarative/uiScrim.ts";
import { uiStack } from "../../../ui/declarative/uiStack.ts";
import { fillUiSize } from "../../../ui/uiSize.ts";
import { Camera } from "../../../rendering/camera.ts";
import { RenderScope } from "../../../rendering/renderScope.ts";
import { getTile, TileComponentId } from "../../component/tileComponent.ts";
import { Entity } from "../../entity/entity.ts";
import { SelectionState } from "../state/selection/selectionState.ts";
import { CommitableInteractionStateChanger } from "./interactionStateChanger.ts";
import { InteractionStateHistory } from "./interactionStateHistory.ts";
import { type StateContext } from "./stateContext.ts";
import type { GameSaveCapability } from "../../../server/gameServerConnection.ts";
import type { GameCommand } from "../../../server/message/gameCommand.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import { entitiesFrontToBack } from "../../component/spriteComponent.ts";
import type { EcsWorld } from "../../../common/ecs/ecsWorld.ts";
import { log } from "../../../common/logging/logger.ts";
import { uiStatusBar } from "../view/uiStatusBar.ts";

const SCRIM_COLOR = "rgba(20, 20, 20, 0.8)";

/**
 * The interactionHandler recieves input taps and forward them to the currently
 * active state. It also handles the transition and history of states.
 */
export class InteractionHandler {
    private camera: Camera;
    private world: EcsWorld;
    private interactionStateChanger: CommitableInteractionStateChanger;
    private history: InteractionStateHistory;
    private stateContext: StateContext;
    private uiRenderer: UiRenderer;
    private stateInstanceCounter = 0;
    constructor(
        ecsWorld: EcsWorld,
        camera: Camera,
        assets: AssetLoader,
        time: GameTime,
        uiRenderer: UiRenderer,
        command: (command: GameCommand) => void,
        _visibilityChange: () => void,
        gameSaveCapability?: GameSaveCapability,
    ) {
        this.uiRenderer = uiRenderer;
        this.interactionStateChanger = new CommitableInteractionStateChanger();
        this.camera = camera;
        this.world = ecsWorld;
        this.stateContext = {
            root: this.world.root,
            world: this.world,
            assets: assets,
            stateChanger: this.interactionStateChanger,
            gameTime: time,
            camera: camera,
            commandDispatcher: command,
            gameSaveCapability: gameSaveCapability,
        };
        this.history = new InteractionStateHistory(this.stateContext);
    }

    onTapDown(screenPoint: Point): boolean {
        // Press the declarative UI. Returns true when the press landed on an
        // interactive component, which means the UI captured the pointer.
        const declarativeHandled = this.uiRenderer.onPointerDown(screenPoint);
        if (declarativeHandled) {
            return true;
        }

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

        // Release the declarative UI press. This runs the tap handler for the
        // component that was pressed and released, then clears the press.
        let onTapResult = this.uiRenderer.onPointerUp(screenPoint);

        const worldPosition = this.camera.screenToWorld(screenPoint);
        const currentState = this.history.state;

        // If declarative UI didn't handle it, check if state can handle it
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
                log.debug("Tap was not handled by modal route, popping");
                this.history.pop();
                // Return to stop handling the tap more
                return;
            }

            const tilePosition =
                this.camera.worldSpaceToTileSpace(worldPosition);

            // Check if a tile was clicked at this position
            const tileComponent =
                this.world.root.getEcsComponent(TileComponentId);

            const tile = tileComponent
                ? getTile(tileComponent, tilePosition)
                : null;
            let worldTapHandled = false;

            if (tile) {
                worldTapHandled = currentState.onTileTap(tile);
            }

            if (!worldTapHandled) {
                log.debug("Tap not handled by state, checking for selection");

                const entitiesAt = queryEntity(this.world.root, tilePosition);

                // Cycle entities in the order they are stacked on screen, top
                // first, so the click order matches what the player sees.
                const orderedEntities = entitiesFrontToBack(entitiesAt);

                const candidates: SelectedWorldItem[] = [
                    ...orderedEntities.map((e) => new SelectedEntityItem(e)),
                    ...(tile ? [new SelectedTileItem(tile)] : []),
                ];

                let selection: SelectedWorldItem | null = null;
                if (candidates.length > 0) {
                    const activeSelectionState =
                        currentState instanceof SelectionState
                            ? currentState
                            : null;

                    const currentTilePos =
                        activeSelectionState?.selection.tilePosition;
                    const isSameTile =
                        currentTilePos !== undefined &&
                        currentTilePos.x === tilePosition.x &&
                        currentTilePos.y === tilePosition.y;

                    if (isSameTile && activeSelectionState) {
                        const current = activeSelectionState.selection;
                        let currentIndex: number;
                        if (current instanceof SelectedEntityItem) {
                            currentIndex = orderedEntities.indexOf(
                                current.entity,
                            );
                        } else {
                            // Tile selection is at the end of the candidate list
                            currentIndex = orderedEntities.length;
                        }
                        const nextIndex =
                            currentIndex >= 0
                                ? (currentIndex + 1) % candidates.length
                                : 0;
                        selection = candidates[nextIndex];
                    } else {
                        selection = candidates[0];
                    }
                }

                if (selection) {
                    const selectionState = new SelectionState(selection);
                    if (this.history.size == 1) {
                        this.interactionStateChanger.push(selectionState);
                    } else {
                        this.interactionStateChanger.replace(selectionState);
                    }
                } else {
                    this.interactionStateChanger.clear();
                }
            }
        }

        this.interactionStateChanger.apply(this.history);
    }

    onTapPan(movement: Point, position: Point, startPosition: Point): void {
        // Let the UI press track the pointer. A press that slides off its
        // component un-presses, slides back re-presses, and a release inside
        // the component still taps even though the gesture crossed the drag
        // threshold.
        this.uiRenderer.onPointerMove(position);
        this.history.state.onTapPan(movement, position, startPosition);
    }

    onTapCancel(): void {
        // The system took the touch (incoming call, browser gesture). Drop the
        // press without ever running a tap.
        this.uiRenderer.onPointerCancel();
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

    private getStateInstanceId(): number {
        const state = this.history.state;
        if (state.stateId === undefined) {
            state.stateId = ++this.stateInstanceCounter;
        }
        return state.stateId;
    }

    onUpdate(tick: number) {
        this.history.state.onUpdate(tick);
    }

    /**
     * Builds the root HUD tree: an optional modal scrim layered behind a
     * column holding the status bar on top and the current state's view
     * filling the remaining space beside it.
     *
     * The tree is rebuilt every frame, so scrim visibility and the current
     * state's view follow the interaction state automatically. The scrim is
     * tap-transparent on purpose: modal dismissal stays in onTapDown/onTapUp.
     */
    private buildHudView(): ComponentDescriptor {
        const state = this.history.state;

        const hudChildren: ComponentDescriptor[] = [
            uiStatusBar({ root: this.world.root, key: "statusbar" }),
        ];

        // Wrap the state's view in a keyed container to ensure proper reconciliation
        // Each interaction state gets a unique key so components don't persist across state transitions
        const stateView = state.getView();
        if (stateView) {
            hudChildren.push(
                uiBox({
                    width: fillUiSize,
                    height: fillUiSize,
                    child: stateView,
                    key: `state-${state.constructor.name}-${this.getStateInstanceId()}`,
                }),
            );
        }

        const hudColumn = uiColumn({
            key: "hud",
            width: fillUiSize,
            height: fillUiSize,
            children: hudChildren,
        });

        return uiStack({
            width: fillUiSize,
            height: fillUiSize,
            children: state.isModal
                ? [uiScrim({ color: SCRIM_COLOR, key: "scrim" }), hudColumn]
                : [hudColumn],
        });
    }

    onDraw(renderScope: RenderScope) {
        //const start = performance.now();
        //performance.mark("InteractionStateDraw");
        this.history.state.onDraw(renderScope);

        this.uiRenderer.renderComponent(this.buildHudView());

        //performance.mark("InteractionStateDrawEnd");
        /*performance.measure(
            "UI Drawing",
            "InteractionStateDraw",
            "InteractionStateDrawEnd",
        );*/
        //console.log("Interaction state draw", performance.now() - start);
    }
}
