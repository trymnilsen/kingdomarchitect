import {
    getLightSourceDefinition,
    type LightSourceDefinition,
} from "../../data/light/lightSourceDefinition.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import type { LightSourceComponent } from "../component/lightSourceComponent.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * What an entity is emitting right now: the light granted by whatever it holds,
 * falling back to the profile named on its own component.
 *
 * Equipment refines emission. It never grants membership. Who emits is decided
 * entirely by who carries a {@link LightSourceComponent}, and this function only
 * decides what they emit. An entity holding a torch with no light component is
 * invisible to the collector, and that is deliberate: a torch in a stockpile
 * crate lights nothing. This mirrors how an item's `statModifiers` reach the
 * holder through `getStats` rather than by being copied onto them, so nothing
 * has to be written, cleaned up, or kept in sync when the item moves.
 *
 * This never fires for goblins today: goblin units carry a held item but
 * neither an equipment component nor a light component, so they are not
 * light-source members at all. If one ever gains both, no special case is
 * needed here. The hearthlight scope already filters on player-kingdom
 * ancestry and on the definition's `claimsHearthlight`, and a carried torch
 * satisfies neither, so a goblin would light its surroundings without ever
 * claiming them.
 *
 * The brightest equipped light wins when both hands hold one, rather than
 * summing, because lit-ness is binary and two torches are not a bonfire. Note
 * that any equipped light beats the entity's own profile even when the profile
 * is wider: every emitter with hands currently has a radius-0 presence glow, so
 * the two rules agree. Fold the profile into the same comparison if an entity
 * ever has both hands and a light of its own worth keeping.
 */
export function resolveLightSource(
    entity: Entity,
    source: LightSourceComponent,
): LightSourceDefinition | undefined {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (equipment) {
        let brightest: LightSourceDefinition | undefined = undefined;
        for (const item of [
            equipment.slots.primary,
            equipment.slots.secondary,
        ]) {
            if (!item?.light) {
                continue;
            }
            // An item naming a light that no longer exists is skipped rather
            // than darkening its holder, so a stale id degrades to the
            // entity's own profile.
            const definition = getLightSourceDefinition(item.light);
            if (!definition) {
                continue;
            }
            if (!brightest || definition.lightRadius > brightest.lightRadius) {
                brightest = definition;
            }
        }
        if (brightest) {
            return brightest;
        }
    }

    return getLightSourceDefinition(source.sourceId);
}
