import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import { WatchComponentId } from "../component/watchComponent.ts";
import {
    createLightSourceComponent,
    LightSourceComponentId,
} from "../component/lightSourceComponent.ts";
import {
    buildingGlowLightSource,
    searchlightLightSource,
} from "../../data/light/lightSourceDefinition.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { STATION_MANNED_REACH } from "../vision/visionReach.ts";
import { SWEEP_ORDER, searchlightWedgeOffsets } from "../vision/searchlight.ts";
import { isTowerManned } from "../component/stationQuery.ts";
import { discoverFootprint } from "../map/discoverFootprint.ts";

/**
 * Ticks the auto-sweep dwells on each quarter before advancing. The hearth
 * defense system samples every HEARTH_DEFENSE_INTERVAL (5) ticks, so dwell must
 * stay at or above twice that interval. Below it an intruder can cross a wedge
 * between two defense scans and never register. Whoever retunes either
 * constant meets this comment.
 */
const SEARCHLIGHT_SWEEP_TICKS = 10;

/**
 * Drives the searchlight on manned towers. The tower has one emitter slot and
 * the beam borrows it: a manned tower carries the searchlight component with
 * the current wedge as its pattern, and unmanning restores whatever light the
 * building profile originally attached (its faint self-glow by default,
 * nothing for a "none" profile). The beam's claim therefore vanishes the
 * instant the watchman leaves, exactly like a snuffed cresset.
 *
 * The beam runs in every phase. Its lit claim feeds hearthlight, and whether
 * the wedge looks different at noon is the render pass's business. The beam
 * never tracks hostiles. It rotates (or holds a player-fixed cardinal), and
 * detection falls out of the hearth defense system reading the lit tiles it
 * claims.
 *
 * Each aim advance stamps the freshly swept wedge into the discovered store, so
 * a border tower maps its surroundings over a full rotation. Discovery is a
 * server-only write to authoritative state. Stamping happens only on aim
 * edges rather than per tick, because setDiscoveryForPlayer walks chunk
 * lookups per point and can trigger lazy chunk generation.
 */
export const watchSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, tick: number) {
    for (const [tower, watch] of root.queryComponents(WatchComponentId)) {
        const light = tower.getEcsComponent(LightSourceComponentId);
        // Deliberately a raw sourceId read rather than resolveLightSource:
        // this asks whether the beam this system installs is already there,
        // which is a question about the component's own written state. What
        // the tower emits is nobody's business here.
        const hasSearchlight = light?.sourceId === searchlightLightSource.id;

        if (!isTowerManned(root, tower)) {
            if (hasSearchlight) {
                restoreBuildingLight(tower);
            }
            continue;
        }

        const previousAim = watch.beamAim;
        if (watch.searchlight !== "auto") {
            watch.beamAim = watch.searchlight;
        } else {
            // Derived from the tick rather than incremented, so the sweep needs
            // no stored counter and survives save and load unchanged.
            watch.beamAim =
                SWEEP_ORDER[
                    Math.floor(tick / SEARCHLIGHT_SWEEP_TICKS) %
                        SWEEP_ORDER.length
                ];
        }
        const aimChanged = watch.beamAim !== previousAim;

        if (!hasSearchlight) {
            tower.setEcsComponent(
                createLightSourceComponent(
                    searchlightLightSource.id,
                    searchlightWedgeOffsets(
                        watch.beamAim,
                        STATION_MANNED_REACH,
                    ),
                ),
            );
            discoverFootprint(root, tower, tower.worldPosition);
        } else if (aimChanged) {
            tower.updateComponent(LightSourceComponentId, (component) => {
                component.pattern = searchlightWedgeOffsets(
                    watch.beamAim,
                    STATION_MANNED_REACH,
                );
            });
            discoverFootprint(root, tower, tower.worldPosition);
        }

        if (aimChanged) {
            tower.invalidateComponent(WatchComponentId);
        }
    }
}

/**
 * Puts the tower's own building light back when the watchman leaves. The rule
 * mirrors applyFunctionalComponents: the building's named profile, the default
 * self-glow, or nothing for "none". The remove path is what needs the
 * remove-component replication message, or the client would render the old
 * emitter forever.
 */
function restoreBuildingLight(tower: Entity): void {
    const building = tower.getEcsComponent(BuildingComponentId)?.building;
    const lightSourceId = building?.light ?? buildingGlowLightSource.id;
    if (lightSourceId === "none") {
        tower.removeEcsComponent(LightSourceComponentId);
    } else {
        tower.setEcsComponent(createLightSourceComponent(lightSourceId));
    }
}
