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
 * Equipment refines emission without granting it. Emission requires a
 * {@link LightSourceComponent}, and this only decides what is emitted. An
 * entity holding a torch without that component is invisible to the collector,
 * so a torch in a crate lights nothing. Emission is read from the item the same
 * way `getStats` reads its stat modifiers, so nothing needs writing or cleaning
 * up when the item moves.
 *
 * The brightest equipped light wins when both hands hold one. Brightness does
 * not stack, since lit-ness is binary and two torches are not a bonfire. An
 * equipped light also beats the entity's own profile, which is harmless today
 * because every emitter with hands has only a radius-0 presence glow of its
 * own.
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
