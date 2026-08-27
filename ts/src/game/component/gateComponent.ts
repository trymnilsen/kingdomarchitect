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
 * A gate holds no notion of who may pass. Letting friendly feet through while
 * stopping goblins would be a second passability system on top of the
 * pathfinder's. Open or shut is the whole mechanic, and leaving it open at dusk
 * is a mistake the player is allowed to make.
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
 * The sprite a gate should draw for its state. Placement cannot rotate
 * buildings, so every gate runs horizontally.
 */
export function gateSprite(isOpen: boolean): SpriteRef {
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
 * Three things have to move together and are written only here: `isOpen` is
 * what the player set, the traversal weight is what pathfinding reads, and the
 * sprite is what the player sees. The invalidation calls are how the
 * pathfinding graph and the spatial index learn about the change.
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
