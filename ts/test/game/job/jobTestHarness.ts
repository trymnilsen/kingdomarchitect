import type { Point } from "../../../src/common/point.ts";
import {
    createJobRunnerComponent,
    JobRunnerComponentId,
} from "../../../src/game/component/jobRunnerComponent.ts";
import {
    PathfindingGraphRegistryComponentId,
    createPathfindingGraphRegistryComponent,
    createPathfindingGraph,
} from "../../../src/game/component/pathfindingGraphRegistryComponent.ts";
import { createSpaceComponent } from "../../../src/game/component/spaceComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import type { Job } from "../../../src/game/job/job.ts";
import { getJobHandler } from "../../../src/game/job/jobHandlers.ts";
import { createEmptyGraph } from "../../path/testGraph.ts";

/**
 * Test harness for job testing. Sets up a minimal world with a root entity,
 * a runner (worker), and a target entity.
 *
 * This harness is generic and can be used to test any job type.
 * It automatically looks up the appropriate job handler from the job registry.
 */
export class JobTestHarness<T extends Job = Job> {
    root: Entity;
    runner: Entity;
    target: Entity;

    constructor(
        runnerPosition: Point = { x: 0, y: 0 },
        targetPosition: Point = { x: 1, y: 0 },
        options: { enablePathfinding?: boolean; graphSize?: number } = {},
    ) {
        const { enablePathfinding = false, graphSize = 20 } = options;

        // Create root entity
        this.root = new Entity("root");
        this.root.setEcsComponent(createSpaceComponent());

        // Optionally add pathfinding graph component for movement tests
        if (enablePathfinding) {
            const graph = createEmptyGraph(graphSize, graphSize);
            const registry = createPathfindingGraphRegistryComponent();
            const pathfindingGraph = createPathfindingGraph(graph);
            registry.graphs.set(this.root.id, pathfindingGraph);
            this.root.setEcsComponent(registry);
        }

        // Create runner entity (worker)
        this.runner = new Entity("runner");
        this.runner.worldPosition = runnerPosition;
        this.runner.setEcsComponent(createJobRunnerComponent());
        this.root.addChild(this.runner);

        // Create target entity (tree)
        this.target = new Entity("target");
        this.target.worldPosition = targetPosition;
        this.root.addChild(this.target);
    }

    /**
     * Execute the job once using the handler from the job registry
     * @param job The job to execute
     * @param tick The current game tick (defaults to 0)
     */
    executeJob(job: T, tick: number = 0) {
        const handler = getJobHandler(job.id);
        if (!handler) {
            throw new Error(`No handler found for job type: ${job.id}`);
        }
        // Type assertion is safe here as the job registry ensures handler matches job type
        handler(this.root, this.root, this.runner, job as any, tick);
    }

    /**
     * Get the current job assigned to the runner
     */
    getCurrentJob(): T | null {
        const jobRunner = this.runner.getEcsComponent(JobRunnerComponentId);
        return jobRunner?.currentJob as T | null;
    }

    /**
     * Check if the runner has completed the job
     */
    isJobCompleted(): boolean {
        return this.getCurrentJob() === null;
    }
}
