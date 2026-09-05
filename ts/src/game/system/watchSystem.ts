import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    WatchComponentId,
    type Cardinal,
} from "../component/watchComponent.ts";
import {
    createLightSourceComponent,
    LightSourceComponentId,
} from "../component/lightSourceComponent.ts";
import { searchlightLightSource } from "../../data/light/lightSourceDefinition.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { STATION_MANNED_REACH } from "../vision/visionReach.ts";
import { SWEEP_ORDER, searchlightWedgeOffsets } from "../vision/searchlight.ts";
import { isTowerManned } from "../component/stationQuery.ts";
import { discoverFootprint } from "../map/discoverFootprint.ts";
import { createBuildingLightSource } from "../prefab/buildingPrefab.ts";

/**
 * Ticks the auto-sweep dwells on each quarter before advancing. Must stay at or
 * above twice HEARTH_DEFENSE_INTERVAL, the hearth defense sampling rate.
 * Below that an intruder can cross a wedge between two scans and never register.
 */
const SEARCHLIGHT_SWEEP_TICKS = 10;

/**
 * Drives the searchlight on manned towers.
 *
 * The beam runs in every phase. Its lit claim feeds hearthlight, and whether
 * the wedge looks different at noon is the render pass's business.
 */
export const watchSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, tick: number) {
    for (const [tower, watch] of root.queryComponents(WatchComponentId)) {
        const light = tower.getEcsComponent(LightSourceComponentId);
        // Quick check on the light sorce
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
            installSearchlight(tower, watch.beamAim);
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

function installSearchlight(tower: Entity, aim: Cardinal): void {
    const wedge = searchlightWedgeOffsets(aim, STATION_MANNED_REACH);
    if (tower.hasComponent(LightSourceComponentId)) {
        tower.updateComponent(LightSourceComponentId, (component) => {
            component.sourceId = searchlightLightSource.id;
            component.pattern = wedge;
        });
    } else {
        tower.setEcsComponent(
            createLightSourceComponent(searchlightLightSource.id, true, wedge),
        );
    }
}

function restoreBuildingLight(tower: Entity): void {
    const building = tower.requireEcsComponent(BuildingComponentId).building;
    const lightSource = createBuildingLightSource(building);
    if (lightSource) {
        tower.setEcsComponent(lightSource);
    } else {
        tower.removeEcsComponent(LightSourceComponentId);
    }
}
