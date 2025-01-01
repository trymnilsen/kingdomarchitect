import { shuffleItems } from "../../../../common/array.js";
import { TypedEventHandle } from "../../../../common/event/typedEvent.js";
import { adjacentPoints } from "../../../../common/point.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../../entityComponent.js";
import { HealthEvent } from "../../health/healthEvent.js";
import { JobRunnerComponent } from "../../job/jobRunnerComponent.js";
import { SpatialChunkMapComponent } from "../../world/spatialChunkMapComponent.js";
import { AttackJob } from "./attackJob.js";

export enum AggroMode {
    Defensive,
    Agressive,
}

type AggroComponentBundle = {
    aggroMode: AggroMode;
    damage: number;
};

/**
 * The aggro component will check for adjacent actors and assign
 * a job to attack it if the mode is set to agressive. Upon receiving damage it
 * will assign the attack job regardless of [AggroMode]
 */
export class AggroComponent extends EntityComponent {
    private _aggroMode: AggroMode = AggroMode.Agressive;
    private healthEventHandle: TypedEventHandle | undefined;

    constructor(private damage: number) {
        super();
    }

    get aggroMode(): AggroMode {
        return this._aggroMode;
    }

    set aggroMode(v: AggroMode) {
        this._aggroMode = v;
    }

    override onStart(): void {
        this.healthEventHandle = this.entity.componentEvents.listen(
            HealthEvent,
            (event) => {
                if (event.oldHealth > event.newHealth && !!event.causeEntity) {
                    const jobRunner =
                        this.entity.requireComponent(JobRunnerComponent);

                    const hasAttackJob =
                        jobRunner.activeJob instanceof AttackJob;

                    // TODO: Expand logic to allow switching target if the aggro is larger
                    if (!hasAttackJob) {
                        jobRunner.assignJob(
                            new AttackJob(event.causeEntity, this.damage),
                        );
                    }
                }
            },
        );
    }

    override onStop(): void {
        this.healthEventHandle?.dispose();
    }

    override onUpdate(): void {
        if (this._aggroMode == AggroMode.Defensive) {
            return;
        }

        const adjacentPoint = shuffleItems(
            adjacentPoints(this.entity.worldPosition),
        );
        const chunkMap = this.entity
            .getRootEntity()
            .requireComponent(SpatialChunkMapComponent);

        for (const point of adjacentPoint) {
            const entities = chunkMap.getEntitiesAt(point.x, point.y);
            const actor = entities.find((item) => {
                return !!item.getComponent(WorkerBehaviorComponent);
            });

            if (actor) {
                const jobRunner =
                    this.entity.requireComponent(JobRunnerComponent);

                const hasAttackJob = jobRunner.activeJob instanceof AttackJob;

                if (!hasAttackJob) {
                    jobRunner.assignJob(new AttackJob(actor, this.damage));
                }
            }
        }
    }
}
