import { shuffleItems } from "../../../../common/array.js";
import { TypedEventHandle } from "../../../../common/event/typedEvent.js";
import { adjacentPoints } from "../../../../common/point.js";
import { WorkerBehaviorComponent } from "../../behavior/workerBehaviorComponent.js";
import { ComponentFactory, EntityComponent } from "../../entityComponent.js";
import { HealthEvent } from "../../health/healthEvent.js";
import { JobRunnerComponent } from "../../job/jobRunnerComponent.js";
import { AttackJob } from "./attackJob.js";

export enum AggroMode {
    Defensive,
    Agressive,
}

type AggroComponentBundle = {
    aggroMode: AggroMode;
};

/**
 * The aggro component will check for adjacent actors and assign
 * a job to attack it if the mode is set to agressive. Upon receiving damage it
 * will assign the attack job regardless of [AggroMode]
 */
export class AggroComponent extends EntityComponent<AggroComponentBundle> {
    private _aggroMode: AggroMode = AggroMode.Agressive;
    private healthEventHandle: TypedEventHandle | undefined;

    constructor(private damage: number) {
        //TODO: Move damage from field here to a value from the equipment on
        //the entity
        super();
    }

    public get aggroMode(): AggroMode {
        return this._aggroMode;
    }

    public set aggroMode(v: AggroMode) {
        this._aggroMode = v;
    }

    override onStart(tick: number): void {
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
                            new AttackJob(event.causeEntity, this.damage)
                        );
                    }
                }
            }
        );
    }

    override onStop(tick: number): void {
        this.healthEventHandle?.dispose();
    }

    override onUpdate(tick: number): void {
        if (this._aggroMode == AggroMode.Defensive) {
            return;
        }

        const adjacentPoint = shuffleItems(
            adjacentPoints(this.entity.worldPosition)
        );
        const rootEntity = this.entity.getRootEntity() as RootEntity;

        for (const point of adjacentPoint) {
            const entities = rootEntity.getEntityAt(point);
            const actor = entities.find((item) => {
                return !!item.getComponent(WorkerBehaviorComponent);
            });

            if (!!actor) {
                const jobRunner =
                    this.entity.requireComponent(JobRunnerComponent);

                const hasAttackJob = jobRunner.activeJob instanceof AttackJob;

                if (!hasAttackJob) {
                    jobRunner.assignJob(new AttackJob(actor, this.damage));
                }
            }
        }
    }

    override factory(): ComponentFactory<{}> {
        throw new Error("Method not implemented.");
    }
    override onPersist(): AggroComponentBundle {}
}

export const aggroComponentFactory = (data: AggroComponentBundle) => {
    const component = new AggroComponent();
    component.aggroMode = data.aggroMode;
};
