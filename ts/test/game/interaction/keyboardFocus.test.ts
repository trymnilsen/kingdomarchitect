import { describe, it } from "node:test";
import assert from "node:assert";
import type { Point } from "../../../src/common/point.ts";
import {
    setChunk,
    TileComponentId,
} from "../../../src/game/component/tileComponent.ts";
import { worldFirstFocus } from "../../../src/game/interaction/focus/focusDomain.ts";
import { InteractionState } from "../../../src/game/interaction/handler/interactionState.ts";
import { SelectedEntityItem } from "../../../src/game/interaction/selection/selectedEntityItem.ts";
import { SelectionState } from "../../../src/game/interaction/state/selection/selectionState.ts";
import { createLandTerrain } from "../../../src/game/map/chunk.ts";
import { HalfTileSize } from "../../../src/game/map/tile.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import { InputActionType } from "../../../src/input/inputAction.ts";
import type { ComponentDescriptor } from "../../../src/ui/declarative/ui.ts";
import { uiButton } from "../../../src/ui/declarative/uiButton.ts";
import { colorBackground } from "../../../src/ui/uiBackground.ts";
import { createGestureHarness, type GestureHarness } from "./gestureHarness.ts";

/** Land on chunk 0,0 only, so tiles 0 to 15 exist and tile -1 does not. */
function harnessWithLand(): GestureHarness {
    const harness = createGestureHarness();
    const tiles = harness.world.root.requireEcsComponent(TileComponentId);
    setChunk(tiles, { chunkX: 0, chunkY: 0, terrain: createLandTerrain() });
    return harness;
}

function screenCenterOfTile(harness: GestureHarness, tile: Point): Point {
    const topLeft = harness.camera.tileSpaceToScreenSpace(tile);
    return { x: topLeft.x + HalfTileSize, y: topLeft.y + HalfTileSize };
}

function selectedTile(harness: GestureHarness): Point | undefined {
    return harness.currentState().getWorldSelection()?.tilePosition;
}

/** What the selection state holds: an entity's id, or "ground" for the tile. */
function selectedThing(harness: GestureHarness): string {
    const state = harness.currentState();
    assert.ok(state instanceof SelectionState);
    if (state.selection instanceof SelectedEntityItem) {
        return state.selection.entity.id;
    }
    return "ground";
}

describe("pressing a tile by tap or by key", () => {
    it("cycles through what is stacked there, whichever input presses it", () => {
        const harness = harnessWithLand();
        // Taps only find entities through the spatial index
        harness.world.addSystem(chunkMapSystem);
        const stacked = { x: 6, y: 4 };
        for (const id of ["worker-a", "worker-b"]) {
            const worker = workerPrefab(id);
            harness.world.root.addChild(worker);
            worker.worldPosition = stacked;
        }
        const tapped = screenCenterOfTile(harness, stacked);

        harness.mouseGesture([tapped, tapped]);
        const first = selectedThing(harness);
        harness.key(InputActionType.ACTION_PRESS);
        const second = selectedThing(harness);
        harness.mouseGesture([tapped, tapped]);
        const third = selectedThing(harness);
        harness.key(InputActionType.ACTION_PRESS);

        assert.deepStrictEqual(
            [first, second, third].sort(),
            ["ground", "worker-a", "worker-b"],
        );
        assert.strictEqual(third, "ground", "the ground comes last");
        assert.strictEqual(selectedThing(harness), first, "and then wraps");
    });

    it("a tap elsewhere selects afresh instead of cycling", () => {
        const harness = harnessWithLand();
        const tapped = screenCenterOfTile(harness, { x: 3, y: 2 });
        harness.mouseGesture([tapped, tapped]);

        const elsewhere = screenCenterOfTile(harness, { x: 9, y: 7 });
        harness.mouseGesture([elsewhere, elsewhere]);

        assert.deepStrictEqual(selectedTile(harness), { x: 9, y: 7 });
        harness.key(InputActionType.BACK_PRESS);
        assert.strictEqual(
            selectedTile(harness),
            undefined,
            "the new selection took the old one's place, so back leaves both",
        );
    });
});

describe("keyboard focus in the world", () => {
    it("an arrow after tapping a tile moves the selection to the next tile", () => {
        const harness = harnessWithLand();
        const tapped = screenCenterOfTile(harness, { x: 3, y: 2 });
        harness.mouseGesture([tapped, tapped]);
        assert.deepStrictEqual(selectedTile(harness), { x: 3, y: 2 });

        harness.key(InputActionType.RIGHT_PRESS);

        assert.ok(harness.currentState() instanceof SelectionState);
        assert.deepStrictEqual(selectedTile(harness), { x: 4, y: 2 });
    });

    it("with nothing selected an arrow selects next to the screen centre", () => {
        const harness = harnessWithLand();
        harness.camera.position = { x: 5 * 32 + 16, y: 5 * 32 + 16 };

        harness.key(InputActionType.DOWN_PRESS);

        assert.deepStrictEqual(selectedTile(harness), { x: 5, y: 6 });
    });

    it("does not move the selection off the land", () => {
        const harness = harnessWithLand();
        const tapped = screenCenterOfTile(harness, { x: 0, y: 0 });
        harness.mouseGesture([tapped, tapped]);

        harness.key(InputActionType.LEFT_PRESS);

        assert.deepStrictEqual(selectedTile(harness), { x: 0, y: 0 });
    });

    it("starts at the screen centre once the remembered place is off screen", () => {
        const harness = harnessWithLand();
        const tapped = screenCenterOfTile(harness, { x: 0, y: 0 });
        harness.mouseGesture([tapped, tapped]);
        harness.key(InputActionType.BACK_PRESS);

        // Pan away so tile 0,0 is far off screen
        harness.camera.position = { x: 40 * 32 + 16, y: 40 * 32 + 16 };
        const tiles = harness.world.root.requireEcsComponent(TileComponentId);
        setChunk(tiles, { chunkX: 2, chunkY: 2, terrain: createLandTerrain() });

        harness.key(InputActionType.RIGHT_PRESS);

        assert.deepStrictEqual(selectedTile(harness), { x: 41, y: 40 });
    });

    it("going back keeps the place, so the next arrow continues from it", () => {
        const harness = harnessWithLand();
        const tapped = screenCenterOfTile(harness, { x: 3, y: 2 });
        harness.mouseGesture([tapped, tapped]);

        harness.key(InputActionType.BACK_PRESS);
        assert.strictEqual(selectedTile(harness), undefined);

        harness.key(InputActionType.UP_PRESS);
        assert.deepStrictEqual(selectedTile(harness), { x: 3, y: 1 });
    });
});

const OPEN_BUTTON = "open-button";

/** A state with one button that opens a modal with one button of its own. */
class OpenerState extends InteractionState {
    opened = 0;

    override getView(): ComponentDescriptor {
        return uiButton({
            width: 80,
            height: 40,
            background: colorBackground(OPEN_BUTTON),
            onTap: () => {
                this.opened += 1;
                this.context.stateChanger.push(new ModalWithButton());
            },
        });
    }
}

class ModalWithButton extends InteractionState {
    override get isModal(): boolean {
        return true;
    }

    override getView(): ComponentDescriptor {
        return uiButton({
            width: 120,
            height: 60,
            background: colorBackground("modal-button"),
            onTap: () => {},
        });
    }
}

describe("keyboard focus on the HUD", () => {
    it("an arrow shows focus and the action key presses the button", () => {
        const harness = createGestureHarness();
        const state = new OpenerState();
        harness.pushState(state);
        assert.strictEqual(harness.hudFocus(), null);

        harness.key(InputActionType.RIGHT_PRESS);
        assert.notStrictEqual(harness.hudFocus(), null);

        harness.key(InputActionType.ACTION_PRESS);
        assert.strictEqual(state.opened, 1);
    });

    it("focus follows into a modal and back to the button that opened it", () => {
        const harness = createGestureHarness();
        harness.pushState(new OpenerState());
        harness.key(InputActionType.RIGHT_PRESS);
        const openerFocus = harness.hudFocus();

        harness.key(InputActionType.ACTION_PRESS);
        assert.ok(harness.currentState() instanceof ModalWithButton);
        assert.notStrictEqual(harness.hudFocus(), null);
        assert.notDeepStrictEqual(harness.hudFocus(), openerFocus);

        harness.key(InputActionType.BACK_PRESS);
        assert.ok(harness.currentState() instanceof OpenerState);
        assert.deepStrictEqual(harness.hudFocus(), openerFocus);
    });

    it("tapping hides focus and never shows it in the next state", () => {
        const harness = createGestureHarness();
        harness.pushState(new OpenerState());
        harness.key(InputActionType.RIGHT_PRESS);

        const button = harness.centerOf(OPEN_BUTTON);
        harness.mouseGesture([button, button]);

        assert.ok(harness.currentState() instanceof ModalWithButton);
        assert.strictEqual(harness.hudFocus(), null);
    });
});

/** A state offering the world first, with one HUD button that opens another. */
class WorldFirstState extends InteractionState {
    override get focusDomains() {
        return worldFirstFocus;
    }

    override getView(): ComponentDescriptor {
        return uiButton({
            width: 80,
            height: 40,
            background: colorBackground("world-first-button"),
            onTap: () => {
                this.context.stateChanger.push(new AnotherWorldFirstState());
            },
        });
    }
}

class AnotherWorldFirstState extends InteractionState {
    override get focusDomains() {
        return worldFirstFocus;
    }
}

describe("keyboard focus across states that start in the world", () => {
    it("returns focus to the button that opened a state with no HUD focus", () => {
        const harness = createGestureHarness();
        harness.pushState(new WorldFirstState());
        harness.key(InputActionType.FOCUS_CYCLE_PRESS);
        const buttonFocus = harness.hudFocus();
        assert.notStrictEqual(buttonFocus, null);

        harness.key(InputActionType.ACTION_PRESS);
        assert.ok(harness.currentState() instanceof AnotherWorldFirstState);
        assert.strictEqual(
            harness.hudFocus(),
            null,
            "the keys go to the world there, so the HUD shows no focus",
        );

        harness.key(InputActionType.BACK_PRESS);
        assert.ok(harness.currentState() instanceof WorldFirstState);
        assert.deepStrictEqual(harness.hudFocus(), buttonFocus);
    });
});
