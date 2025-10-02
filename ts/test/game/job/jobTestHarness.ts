import type { Point } from "../../../src/common/point.js";
import {
    createJobRunnerComponent,
    JobRunnerComponentId,
} from "../../../src/game/component/jobRunnerComponent.js";
import { PathfindingGraphComponentId } from "../../../src/game/component/pathfindingGraphComponent.js";
import { Entity } from "../../../src/game/entity/entity.js";
import {
    chopTreeHandler,
    type ChopTreeJob,
} from "../../../src/game/job/chopTreeJob.js";
import { PathCache } from "../../../src/game/map/path/pathCache.js";
import { createEmptyGraph } from "../../path/testGraph.js";

/**
 * Test harness for job testing. Sets up a minimal world with a root entity,
 * a runner (worker), and a target entity.
 */
class JobTestHarness {
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

        // Optionally add pathfinding graph component for movement tests
        if (enablePathfinding) {
            const graph = createEmptyGraph(graphSize, graphSize);
            this.root.setEcsComponent({
                id: PathfindingGraphComponentId,
                graph: graph,
                pathCache: new PathCache(),
            });
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
     * Execute the job handler once
     */
    executeJob(job: ChopTreeJob) {
        chopTreeHandler(this.root, this.runner, job);
    }

    /**
     * Get the current job assigned to the runner
     */
    getCurrentJob(): ChopTreeJob | null {
        const jobRunner = this.runner.getEcsComponent(JobRunnerComponentId);
        return jobRunner?.currentJob as ChopTreeJob | null;
    }

    /**
     * Check if the runner has completed the job
     */
    isJobCompleted(): boolean {
        return this.getCurrentJob() === null;
    }
}
