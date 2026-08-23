import { generateId } from "../../common/idGenerator.ts";
import type { Building } from "../../data/building/building.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import { createBuildingComponent } from "../component/buildingComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";
import { createVisibilityComponent } from "../component/visibilityComponent.ts";
import { BUILDING_VISION_REACH } from "../vision/visionReach.ts";
import { createHousingComponent } from "../component/housingComponent.ts";
import { createCraftingComponent } from "../component/craftingComponent.ts";
import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.ts";
import { createInventoryComponent } from "../component/inventoryComponent.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import { getRecipesForBuilding } from "../../data/crafting/craftingStations.ts";
import { createWorkplaceComponent } from "../component/workplaceComponent.ts";
import { createStockpileComponent } from "../component/stockpileComponent.ts";
import { forrester } from "../../data/building/wood/forrester.ts";
import { createProductionComponent } from "../component/productionComponent.ts";
import { goblinCampfire } from "../../data/building/goblin/goblinCampfire.ts";
import { goblinHut } from "../../data/building/goblin/goblinHut.ts";
import {
    createFireSourceComponent,
    FireSourceComponentId,
} from "../component/fireSourceComponent.ts";
import { farm } from "../../data/building/grow/grow.ts";
import {
    createFarmComponent,
    FarmComponentId,
} from "../component/farmComponent.ts";
import {
    createTraversalComponent,
    TraversalComponentId,
} from "../component/traversalComponent.ts";
import {
    createGateComponent,
    gateSprite,
    gateTraversalWeight,
    GateComponentId,
} from "../component/gateComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import { buildingGlowLightSource } from "../../data/light/lightSourceDefinition.ts";
import {
    createLightSourceComponent,
    LightSourceComponentId,
} from "../component/lightSourceComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import { stoneTower } from "../../data/building/stone/tower.ts";
import {
    createStationComponent,
    StationComponentId,
} from "../component/stationComponent.ts";
import {
    createWatchComponent,
    WatchComponentId,
} from "../component/watchComponent.ts";
import { CraftingComponentId } from "../component/craftingComponent.ts";
import { WorkplaceComponentId } from "../component/workplaceComponent.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import { ProductionComponentId } from "../component/productionComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";

export function buildingPrefab(
    building: Building,
    startScaffolded: boolean = false,
    id?: string,
): Entity {
    const entity = new Entity(id ?? generateId("building"));
    entity.setEcsComponent(createBuildingComponent(building, startScaffolded));
    entity.setEcsComponent(
        createHealthComponent(startScaffolded ? 0 : 100, 100),
    );
    entity.setEcsComponent(createVisibilityComponent(BUILDING_VISION_REACH));

    // The default sprite goes on first so that applyFunctionalComponents can
    // replace it. A gate draws its own art for its open or shut state, and it
    // can only do that if the generic icon is already in place to overwrite.
    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? spriteRefs.wooden_house_scaffold : building.icon,
            { x: 0, y: 0 },
        ),
    );

    if (startScaffolded) {
        // Scaffolded buildings only get an inventory to hold construction materials
        if (building.requirements?.materials) {
            entity.setEcsComponent(createInventoryComponent());
        }
    } else {
        applyFunctionalComponents(entity, building);
    }

    return entity;
}

/**
 * Turn an entity into a crafting station: it can craft `recipes`, holds staged
 * inputs and outputs in an inventory, and is a workplace a worker mans.
 */
function applyCraftingStation(
    entity: Entity,
    recipes: readonly CraftingRecipe[],
): void {
    entity.setEcsComponent(createCraftingComponent(recipes));
    entity.setEcsComponent(createInventoryComponent());
    entity.setEcsComponent(createWorkplaceComponent());
    entity.invalidateComponent(CraftingComponentId);
    entity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(WorkplaceComponentId);
}

/**
 * Attaches the functional ECS components for a completed building.
 * Called both when creating a non-scaffolded building and when construction finishes.
 */
export function applyFunctionalComponents(
    entity: Entity,
    building: Building,
): void {
    // Every completed building emits light: its faint self-glow by default, a
    // per-type override, or nothing when set to "none". Dedicated light sources
    // (e.g. the lamp post) flow through this same path by naming their profile.
    // Because this runs only for non-scaffolded buildings, foundations never
    // glow without any extra check.
    const lightSourceId = building.light ?? buildingGlowLightSource.id;
    if (lightSourceId !== "none") {
        entity.setEcsComponent(createLightSourceComponent(lightSourceId));
        entity.invalidateComponent(LightSourceComponentId);
    }

    if (building.id == woodenHouse.id) {
        entity.setEcsComponent(createHousingComponent());
        entity.invalidateComponent(HousingComponentId);
    }
    const stationRecipes = getRecipesForBuilding(building.id);
    if (stationRecipes) {
        applyCraftingStation(entity, stationRecipes);
    }
    // Any building that declares a storage capacity is a store. Keying off the
    // data rather than a list of ids means adding a bigger granary later is a
    // data change, not a change here.
    if (building.storageCapacity !== undefined) {
        entity.setEcsComponent(createInventoryComponent());
        entity.setEcsComponent(
            createStockpileComponent(building.storageCapacity),
        );
        entity.setEcsComponent(createWorkplaceComponent());
        entity.invalidateComponent(InventoryComponentId);
        entity.invalidateComponent(StockpileComponentId);
        entity.invalidateComponent(WorkplaceComponentId);
    }
    if (building.id == forrester.id) {
        entity.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );
        entity.invalidateComponent(ProductionComponentId);
    }
    if (building.id == goblinCampfire.id) {
        entity.setEcsComponent(createFireSourceComponent(15, 2, 1));
        entity.invalidateComponent(FireSourceComponentId);
    }
    if (building.id == goblinHut.id) {
        entity.setEcsComponent(createHousingComponent());
        entity.invalidateComponent(HousingComponentId);
    }
    if (building.id == farm.id) {
        entity.setEcsComponent(createFarmComponent());
        entity.invalidateComponent(FarmComponentId);
    }
    if (building.isGate) {
        // A new gate is shut. The safe default matters because the whole point
        // of the thing is that an open one lets raiders walk in.
        const gateComponent = createGateComponent(false);
        entity.setEcsComponent(gateComponent);
        entity.setEcsComponent(
            createTraversalComponent(gateTraversalWeight(gateComponent.isOpen)),
        );
        entity.setEcsComponent(
            createSpriteComponent(gateSprite(gateComponent.isOpen), {
                x: 0,
                y: 0,
            }),
        );
        entity.invalidateComponent(GateComponentId);
        entity.invalidateComponent(TraversalComponentId);
        entity.invalidateComponent(SpriteComponentId);
    }
    if (building.id == stoneTower.id) {
        // The lookout station: a worker stationed on top surveys a wide area by day
        // and runs the searchlight watch by night. Priority defaults to Off (inert).
        entity.setEcsComponent(createStationComponent());
        entity.setEcsComponent(createWatchComponent());
        entity.invalidateComponent(StationComponentId);
        entity.invalidateComponent(WatchComponentId);
    }
}
