import { Entity } from "../../../src/game/entity/entity.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createEnergyComponent } from "../../../src/game/component/energyComponent.ts";
import {
    createJobQueueComponent,
} from "../../../src/game/component/jobQueueComponent.ts";
import type { Jobs } from "../../../src/game/job/job.ts";
import { ResourceHarvestMode } from "../../../src/data/inventory/items/naturalResource.ts";
import type { ComponentID } from "../../../src/game/component/component.ts";
import type { EntityEvent } from "../../../src/game/entity/entityEvent.ts";

/**
 * Tracker for component invalidations during tests.
 * Attach to a root entity to capture all component_updated events.
 */
export class InvalidationTracker {
    private invalidatedComponents: Map<string, Set<ComponentID>> = new Map();

    /**
     * Attach this tracker to an entity to capture invalidation events.
     * Events bubble up, so attaching to root captures all child invalidations.
     */
    attach(entity: Entity): void {
        entity.entityEvent = (event: EntityEvent) => {
            if (event.id === "component_updated") {
                const entityId = event.source.id;
                if (!this.invalidatedComponents.has(entityId)) {
                    this.invalidatedComponents.set(entityId, new Set());
                }
                this.invalidatedComponents.get(entityId)!.add(event.item.id);
            }
        };
    }

    /**
     * Check if a component was invalidated on a specific entity.
     */
    wasInvalidated(entityId: string, componentId: ComponentID): boolean {
        return this.invalidatedComponents.get(entityId)?.has(componentId) ?? false;
    }

    /**
     * Check if a component was invalidated on any entity.
     */
    wasInvalidatedOnAny(componentId: ComponentID): boolean {
        for (const components of this.invalidatedComponents.values()) {
            if (components.has(componentId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all component IDs that were invalidated on an entity.
     */
    getInvalidated(entityId: string): ComponentID[] {
        return Array.from(this.invalidatedComponents.get(entityId) ?? []);
    }

    /**
     * Clear all tracked invalidations.
     */
    clear(): void {
        this.invalidatedComponents.clear();
    }
}

/**
 * Create a minimal test entity with required components for behavior testing.
 */
export function createTestEntity(
    id: string = "test-entity",
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = new Entity(id);
    entity.worldPosition = { x, y };
    return entity;
}

/**
 * Create a test entity with behavior agent component.
 */
export function createBehaviorTestEntity(
    id: string = "test-entity",
    x: number = 0,
    y: number = 0,
): Entity {
    const entity = createTestEntity(id, x, y);
    entity.setEcsComponent(createBehaviorAgentComponent());
    return entity;
}

/**
 * Create a test entity with energy component.
 */
export function createEntityWithEnergy(
    id: string = "test-entity",
    energy: number = 100,
): Entity {
    const entity = createBehaviorTestEntity(id);
    const energyComponent = createEnergyComponent();
    energyComponent.energy = energy;
    entity.setEcsComponent(energyComponent);
    return entity;
}

/**
 * Create a test root entity with job queue.
 */
export function createRootWithJobQueue(jobs: Jobs[] = []): Entity {
    const root = new Entity("root");
    const jobQueue = createJobQueueComponent();
    jobQueue.jobs = jobs;
    root.setEcsComponent(jobQueue);
    return root;
}

/**
 * Setup a complete test scene with root and worker entity.
 */
export function createTestScene(): {
    root: Entity;
    worker: Entity;
} {
    const root = createRootWithJobQueue();
    const worker = createBehaviorTestEntity("worker");
    root.addChild(worker);
    return { root, worker };
}

/**
 * Create a test job with default values.
 */
export function createTestJob(
    id: "collectResource" = "collectResource",
    entityId: string = "resource-1",
): Extract<Jobs, { id: "collectResource" }> {
    return {
        id,
        entityId,
        harvestAction: ResourceHarvestMode.Pick,
    };
}
