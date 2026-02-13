import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    GoblinCampComponentId,
    type GoblinCampComponent,
} from "../component/goblinCampComponent.ts";
import {
    GoblinUnitComponentId,
    createGoblinUnitComponent,
} from "../component/goblinUnitComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import { FireSourceComponentId } from "../component/fireSourceComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { goblinHut } from "../../data/building/goblin/goblinHut.ts";
import { goblinPrefab } from "../prefab/goblinPrefab.ts";

/**
 * System that spawns goblins when camp has available housing.
 * Requirements for spawning:
 * - Camp has active fire source
 * - Available hut (housing not assigned)
 * - Below max population
 */
export const goblinSpawnSystem: EcsSystem = {
    onUpdate: (root: Entity, _tick: number) => {
        const camps = root.queryComponents(GoblinCampComponentId);

        for (const [campEntity, campComponent] of camps) {
            processGoblinCamp(root, campEntity, campComponent);
        }
    },
};

function processGoblinCamp(
    root: Entity,
    campEntity: Entity,
    campComponent: GoblinCampComponent,
): void {
    // Count current goblins in this camp
    const goblins = root.queryComponents(GoblinUnitComponentId);
    let goblinCount = 0;
    for (const [_entity, goblinUnit] of goblins) {
        if (goblinUnit.campEntityId === campEntity.id) {
            goblinCount++;
        }
    }

    // Check if at max population
    if (goblinCount >= campComponent.maxPopulation) {
        return;
    }

    // Check for active fire source in camp
    const hasActiveFire = checkCampHasActiveFire(campEntity);
    if (!hasActiveFire) {
        return;
    }

    // Find available housing (goblin hut with no tenant)
    const availableHut = findAvailableGoblinHut(campEntity);
    if (!availableHut) {
        return;
    }

    // Spawn goblin
    const newGoblin = goblinPrefab();
    newGoblin.setEcsComponent(createGoblinUnitComponent(campEntity.id));

    // Position goblin at the hut
    newGoblin.position = { ...availableHut.position };

    // Assign housing
    const housing = availableHut.getEcsComponent(HousingComponentId);
    if (housing) {
        housing.tenant = newGoblin.id;
        availableHut.invalidateComponent(HousingComponentId);
    }

    campEntity.addChild(newGoblin);

    console.log(
        `[GoblinSpawnSystem] Spawned goblin ${newGoblin.id} at camp ${campEntity.id}`,
    );
}

function checkCampHasActiveFire(campEntity: Entity): boolean {
    for (const child of campEntity.children) {
        const fireSource = child.getEcsComponent(FireSourceComponentId);
        if (fireSource?.isActive) {
            return true;
        }
    }
    return false;
}

function findAvailableGoblinHut(campEntity: Entity): Entity | null {
    for (const child of campEntity.children) {
        const building = child.getEcsComponent(BuildingComponentId);
        if (!building || building.building.id !== goblinHut.id) {
            continue;
        }
        // Skip scaffolded buildings
        if (building.scaffolded) {
            continue;
        }
        const housing = child.getEcsComponent(HousingComponentId);
        if (housing && !housing.tenant) {
            return child;
        }
    }
    return null;
}
