import { log } from "../../../common/logging/logger.ts";
import { getBuildingById } from "../../../data/building/buildings.ts";
import type { BuildCommand } from "../../../server/message/command/buildCommand.ts";
import type { ClearBuildingJobsCommand } from "../../../server/message/command/clearBuildingJobsCommand.ts";
import type { DismantleBuildingCommand } from "../../../server/message/command/dismantleBuildingCommand.ts";
import { placeBuildingAt } from "../../building/placeBuilding.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { HealthComponentId } from "../../component/healthComponent.ts";
import {
    addJob,
    JobQueueComponentId,
} from "../../component/jobQueueComponent.ts";
import { findPlayerKingdom } from "../../component/playerKingdomComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import { BuildBuildingJob } from "../../job/buildBuildingJob.ts";
import {
    cancelScaffold,
    createDismantleBuildingJob,
    hasDismantleJobForBuilding,
    stopConstruction,
} from "../../job/dismantleBuildingJob.ts";
import { isTargetOfJob } from "../../job/job.ts";

/**
 * Handlers for putting buildings down and taking them back up.
 *
 * Placing a building creates the entity as a scaffold straight away and queues
 * the work that fills it in, so the player sees the footprint before a worker
 * has walked over.
 */
export function buildBuilding(root: Entity, command: BuildCommand) {
    const points = Array.isArray(command.position)
        ? command.position
        : [command.position];
    const building = getBuildingById(command.buildingId);
    if (!building) {
        log.error("Building not found", { buildingId: command.buildingId });
        return;
    }

    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found, cannot place building");
        return;
    }

    for (const point of points) {
        const buildingEntity = placeBuildingAt(
            root,
            playerKingdom,
            building,
            point,
        );
        const job = BuildBuildingJob(buildingEntity);
        playerKingdom.updateComponent(JobQueueComponentId, (component) => {
            component.jobs.push(job);
        });
    }
}

export function dismantleBuilding(
    root: Entity,
    command: DismantleBuildingCommand,
) {
    const building = root.findEntity(command.buildingId);
    if (!building) {
        log.warn("Building not found for Dismantle", {
            buildingId: command.buildingId,
        });
        return;
    }

    const buildingComponent = building.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        log.warn("Dismantle target is not a building", {
            buildingId: command.buildingId,
        });
        return;
    }

    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.error("Player kingdom not found, cannot dismantle");
        return;
    }

    // Only player-owned buildings can be dismantled. Goblin and enemy
    // structures are off limits.
    if (getSettlementEntity(building) !== playerKingdom) {
        log.warn("Refusing to dismantle a building the player does not own", {
            buildingId: command.buildingId,
        });
        return;
    }

    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);

    // Idempotent: ignore repeat presses while a dismantle is already queued.
    if (hasDismantleJobForBuilding(jobQueue, building.id)) {
        return;
    }

    // Decide from the building's live state, not what the client rendered.
    if (buildingComponent.scaffolded) {
        // Stop the in-flight construction first so the builder can't keep
        // healing the building while we tear it down.
        stopConstruction(playerKingdom, building);

        const health = building.getEcsComponent(HealthComponentId);
        const hp = health?.currentHp ?? 0;
        if (hp <= 0) {
            // An untouched scaffold has nothing built into it yet, so it can go
            // away immediately.
            cancelScaffold(root, building);
            return;
        }
    }

    // Completed building, or a partially-built scaffold: a worker drains its HP.
    addJob(jobQueue, createDismantleBuildingJob(building.id));
    playerKingdom.invalidateComponent(JobQueueComponentId);
}

export function clearBuildingJobs(
    root: Entity,
    command: ClearBuildingJobsCommand,
) {
    const playerKingdom = findPlayerKingdom(root);
    if (!playerKingdom) {
        log.warn("Player kingdom not found for ClearBuildingJobs");
        return;
    }

    const building = root.findEntity(command.buildingId);
    if (!building) {
        log.warn("Building not found for ClearBuildingJobs", {
            buildingId: command.buildingId,
        });
        return;
    }

    const jobQueue = playerKingdom.requireEcsComponent(JobQueueComponentId);
    jobQueue.jobs = jobQueue.jobs.filter(
        (job) =>
            !(
                job.id === command.jobTypeId &&
                job.claimedBy === undefined &&
                isTargetOfJob(job, building)
            ),
    );
    playerKingdom.invalidateComponent(JobQueueComponentId);
}
