import { shuffleItems } from "../../../../common/array.js";
import { TypedEventHandle } from "../../../../common/event/typedEvent.js";
import { adjacentPoints } from "../../../../common/point.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { EntityComponent } from "../../entityComponent.js";
import { HealthEvent } from "../../health/healthEvent.js";
import { JobRunnerComponent } from "../../job/jobRunnerComponent.js";
import { ChunkMapComponent } from "../../root/chunk/chunkMapComponent.js";
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
export class AggroComponent extends EntityComponent<AggroComponentBundle> {
    private _aggroMode: AggroMode = AggroMode.Agressive;
    private healthEventHandle: TypedEventHandle | undefined;
    //TODO: Move damage from field here to a value from the equipment on
    //the entity
    private damage = 0;

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

                    //TODO: Expand this logic to allow switching target on
                    // damage if the aggro is larger
                    if (!hasAttackJob) {
                        jobRunner.assignJob(
                            AttackJob.createInstance(
                                event.causeEntity.id,
                                this.damage,
                            ),
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
            .requireComponent(ChunkMapComponent);

        for (const point of adjacentPoint) {
            const entities = chunkMap.getEntityAt(point);
            const actor = entities.find((item) => {
                return !!item.getComponent(WorkerBehaviorComponent);
            });

            if (actor) {
                const jobRunner =
                    this.entity.requireComponent(JobRunnerComponent);

                const hasAttackJob = jobRunner.activeJob instanceof AttackJob;

                if (!hasAttackJob) {
                    jobRunner.assignJob(
                        AttackJob.createInstance(actor.id, this.damage),
                    );
                }
            }
        }
    }

    override fromComponentBundle(bundle: AggroComponentBundle): void {
        this._aggroMode = bundle.aggroMode;
        this.damage = bundle.damage;
    }

    override toComponentBundle(): AggroComponentBundle {
        return {
            aggroMode: this.aggroMode,
            damage: this.damage,
        };
    }

    static createInstance(damage: number): AggroComponent {
        const instance = new AggroComponent();
        instance.fromComponentBundle({
            damage: damage,
            aggroMode: AggroMode.Agressive,
        });
        return instance;
    }
}
