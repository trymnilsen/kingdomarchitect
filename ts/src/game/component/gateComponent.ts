import type { Entity } from "../entity/entity.ts";
import { SpriteComponentId } from "./spriteComponent.ts";
import {
    createTraversalComponent,
    TRAVERSAL_IMPASSABLE_THRESHOLD,
    TraversalComponentId,
} from "./traversalComponent.ts";
import { spriteRefs, type SpriteRef } from "../../asset/sprite.ts";

/**
 * A gate is a hole in a wall that the settlement can shut. Open, anything walks
 * through it, including raiders. Closed, nothing does, including your own
 * workers, and it has to be broken like any other wall.
 *
 * There is deliberately no notion of who may pass. A gate that let friendly feet
 * through while stopping goblins would be a second passability system layered on
 * the one the pathfinder already has. Open or shut is the whole mechanic, and
 * leaving it open at dusk is meant to be a mistake you can make.
 */
export type GateComponent = {
    id: typeof GateComponentId;
    isOpen: boolean;
};

export const GateComponentId = "Gate" as const;

/**
 * Path cost of walking through an open gate. Matches a road: a gateway is a
 * funnel, and routes should happily use one when it stands open.
 */
export const GATE_OPEN_WEIGHT = 1;

/**
 * Path cost of a shut gate. Derived from the threshold rather than restating a
 * literal, so retuning what counts as impassable cannot leave gates open by
 * arithmetic accident.
 */
export const GATE_CLOSED_WEIGHT = TRAVERSAL_IMPASSABLE_THRESHOLD;

export function createGateComponent(isOpen: boolean = false): GateComponent {
    return {
        id: GateComponentId,
        isOpen,
    };
}

/**
 * Which way a gateway runs. Placement cannot rotate buildings, so every gate is
 * horizontal today. This exists as a parameter rather than stored state so that
 * nothing unsettable ends up in a save; when placement learns to rotate, the
 * orientation gets a home then.
 */
export const GateOrientation = {
    Horizontal: "horizontal",
    Vertical: "vertical",
} as const;

export type GateOrientation =
    (typeof GateOrientation)[keyof typeof GateOrientation];

/**
 * The sprite a gate should draw for its orientation and state.
 *
 * The vertical gate uses one sprite for both states on purpose: seen along its
 * axis the part that swings is not visible, so there is nothing to redraw.
 */
export function gateSprite(
    isOpen: boolean,
    orientation: GateOrientation = GateOrientation.Horizontal,
): SpriteRef {
    if (orientation === GateOrientation.Vertical) {
        return spriteRefs.gate_vertical;
    }
    if (isOpen) {
        return spriteRefs.gate_horizontal;
    }
    return spriteRefs.gate_horizontal_closed;
}

/** The traversal weight a gate in this state should carry. */
export function gateTraversalWeight(isOpen: boolean): number {
    return isOpen ? GATE_OPEN_WEIGHT : GATE_CLOSED_WEIGHT;
}

/**
 * Open or shut a gate.
 *
 * This is the only place the parts of a gate's state are written, because they
 * must not drift: `isOpen` is what the player set, the traversal weight is what
 * every pathfinding consumer reads, and the sprite is what the player sees.
 * Invalidating the components is what makes the pathfinding graph and the
 * spatial index pick the change up.
 */
export function setGateOpen(entity: Entity, isOpen: boolean): void {
    const gate = entity.getEcsComponent(GateComponentId);
    if (!gate) {
        return;
    }

    gate.isOpen = isOpen;
    entity.setEcsComponent(
        createTraversalComponent(gateTraversalWeight(isOpen)),
    );

    const sprite = entity.getEcsComponent(SpriteComponentId);
    if (sprite) {
        sprite.sprite = gateSprite(isOpen);
        entity.invalidateComponent(SpriteComponentId);
    }

    entity.invalidateComponent(GateComponentId);
    entity.invalidateComponent(TraversalComponentId);
}
