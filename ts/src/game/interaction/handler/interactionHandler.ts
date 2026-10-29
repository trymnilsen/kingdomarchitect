import { type Point } from "../../../common/point.ts";
import { GameTime } from "../../gameTime.ts";
import { AssetLoader } from "../../../asset/loader/assetLoader.ts";
import { InputType } from "../../../input/input.ts";
import {
    type InputAction,
    InputActionType,
} from "../../../input/inputAction.ts";
import { type OnTapEndEvent } from "../../../input/touchInput.ts";
import { type GroundTile } from "../../map/tile.ts";
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
import { SelectionState } from "../state/selection/selectionState.ts";
import { CommitableInteractionStateChanger } from "./interactionStateChanger.ts";
import { InteractionStateHistory } from "./interactionStateHistory.ts";
import { type StateContext } from "./stateContext.ts";
import { WorldOverlays } from "../overlay/worldOverlays.ts";
import type { GameSaveCapability } from "../../../server/gameServerConnection.ts";
import type { GameCommand } from "../../../server/message/gameCommand.ts";
import type { EcsWorld } from "../../../ecs/ecsWorld.ts";
import { log } from "../../../common/logging/logger.ts";
import { uiStatusBar } from "../view/uiStatusBar.ts";
import { drawFocusCursor, drawSelectionCursor } from "../focus/drawCursor.ts";
import { FocusController } from "../focus/focusController.ts";
import { FocusDomain } from "../focus/focusDomain.ts";
import { WorldSelectionFocusGroup } from "../focus/worldSelectionFocusGroup.ts";
import { selectableItemsAt } from "../selection/selectableItemsAt.ts";

const SCRIM_COLOR = "rgba(20, 20, 20, 0.8)";

/**
 * The interactionHandler recieves taps and key presses and forwards them to
 * the currently active state. It also handles the transition and history of
 * states.
 *
 * Pointer and keyboard meet in two places. On the HUD a key activating a
 * button runs the same tap handler a pointer release does. In the world every
 * press, from a tap or a key, goes through the world focus group to
 * {@link pressTile}. Where the keys go between those two is up to the
 * {@link FocusController}.
 */
export class InteractionHandler {
    private camera: Camera;
    private world: EcsWorld;
    private interactionStateChanger: CommitableInteractionStateChanger;
    private history: InteractionStateHistory;
    private stateContext: StateContext;
    private uiRenderer: UiRenderer;
    private worldFocus: WorldSelectionFocusGroup;
    private focus: FocusController;
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
        this.worldFocus = new WorldSelectionFocusGroup(
            camera,
            ecsWorld.root,
            () => this.history.state.getWorldSelection(),
            (tile) => this.pressTile(tile),
        );
        this.focus = new FocusController(uiRenderer.focus, this.worldFocus);
        this.stateContext = {
            root: this.world.root,
            world: this.world,
            assets: assets,
            stateChanger: this.interactionStateChanger,
            gameTime: time,
            camera: camera,
            commandDispatcher: command,
            worldOverlays: new WorldOverlays(),
            gameSaveCapability: gameSaveCapability,
        };
        this.history = new InteractionStateHistory(this.stateContext);
    }

    /**
     * @returns whether the handler owns the gesture. Otherwise dragging pans
     *     the camera.
     */
    onTapDown(screenPoint: Point): boolean {
        const state = this.history.state;
        // Returns true when the press landed on an interactive component,
        // which means the UI captured the pointer.
        if (this.uiRenderer.onPointerDown(screenPoint)) {
            this.focus.followPointer(FocusDomain.Hud, state);
            return true;
        }

        // A modal owns the gesture even off its UI, so that tapping the faded
        // overlay can pop it
        return state.isModal;
    }

    onTapUp(tapUpEvent: OnTapEndEvent): void {
        // Release the declarative UI press. This runs the tap handler for the
        // component that was pressed and released, then clears the press.
        const uiHandled = this.uiRenderer.onPointerUp(tapUpEvent.position);

        // A drag that ends on the world was panning the camera, so it never
        // selects or dismisses anything
        if (!uiHandled && !tapUpEvent.wasDragging) {
            this.pressWorldAt(tapUpEvent.position);
        }
        this.commitStateChanges(InputType.Pointer);
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
        const state = this.history.state;
        const inputHandled =
            state.onInput(inputAction, this.interactionStateChanger) ||
            this.focus.handleKey(inputAction.action, state);

        if (
            !inputHandled &&
            inputAction.action == InputActionType.BACK_PRESS &&
            !this.interactionStateChanger.hasOperations
        ) {
            this.interactionStateChanger.pop(undefined);
        }
        this.commitStateChanges(InputType.Keyboard);
    }

    onUpdate(tick: number) {
        this.history.state.onUpdate(tick);
    }

    onDraw(renderScope: RenderScope) {
        const state = this.history.state;
        this.stateContext.worldOverlays.draw(this.world.root, renderScope);
        state.onDraw(renderScope);

        // Drawn over the state's own world drawing, such as a building being
        // placed or an attack's reach, so the selection is never hidden.
        const worldSelection = state.getWorldSelection();
        if (worldSelection) {
            drawSelectionCursor(renderScope, worldSelection);
        }

        this.uiRenderer.renderComponent(this.buildHudView());

        const hudFocus = this.uiRenderer.focus.focusedBounds();
        if (hudFocus) {
            drawFocusCursor(renderScope, hudFocus);
        }
    }

    /**
     * A pointer press that the HUD did not take. Over a modal it lands on the
     * scrim and dismisses it, anywhere else it presses the tile beneath it.
     */
    private pressWorldAt(screenPoint: Point): void {
        const state = this.history.state;
        if (state.isModal) {
            log.debug("Tap was not handled by modal route, popping");
            this.interactionStateChanger.pop(undefined);
            return;
        }

        this.focus.followPointer(FocusDomain.World, state);
        const tile = this.camera.worldSpaceToTileSpace(
            this.camera.screenToWorld(screenPoint),
        );
        this.worldFocus.pressTile(tile);
    }

    /**
     * Every press on a world tile ends here, whether it came from a tap or a
     * key. The state gets the first say, and a press it leaves selects what is
     * on the tile.
     */
    private pressTile(position: Point): void {
        const ground = this.groundAt(position);
        if (this.history.state.onTilePress(position, ground)) {
            return;
        }
        this.selectAt(position, ground);
    }

    /**
     * Selects the topmost thing on the tile, or clears back to the root when
     * there is nothing there. From the root the selection is pushed so back
     * returns to it, from any other state it takes that state's place.
     */
    private selectAt(position: Point, ground: GroundTile | null): void {
        const [topmost] = selectableItemsAt(this.world.root, position, ground);
        if (!topmost) {
            this.interactionStateChanger.clear();
            return;
        }

        const selectionState = new SelectionState(topmost);
        if (this.history.size == 1) {
            this.interactionStateChanger.push(selectionState);
        } else {
            this.interactionStateChanger.replace(selectionState);
        }
    }

    private groundAt(position: Point): GroundTile | null {
        const tileComponent = this.world.root.getEcsComponent(TileComponentId);
        if (!tileComponent) {
            return null;
        }
        return getTile(tileComponent, position);
    }

    /**
     * Commits the state operations queued during an input. Every state change
     * goes through here, so it is the one place that sees transitions and
     * can carry focus across them.
     */
    private commitStateChanges(source: InputType): void {
        const previous = this.history.state;
        this.interactionStateChanger.apply(this.history);
        const current = this.history.state;
        if (current !== previous) {
            this.focus.handOver(previous, current, source);
        }
    }

    private getStateInstanceId(): number {
        const state = this.history.state;
        if (state.stateId === undefined) {
            state.stateId = ++this.stateInstanceCounter;
        }
        return state.stateId;
    }

    /**
     * Builds the root HUD tree: an optional modal scrim layered behind a
     * column holding the status bar on top and the current state's view
     * filling the remaining space beside it.
     *
     * The tree is rebuilt every frame, so scrim visibility and the current
     * state's view follow the interaction state on their own. The scrim is
     * tap-transparent, since modal dismissal lives in onTapDown/onTapUp.
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
}
