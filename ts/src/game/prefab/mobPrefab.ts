import { sprites2 } from "../../module/asset/sprite.js";
import { IdleMobComponent } from "../componentOld/actor/mob/IdleMobComponent.js";
import {
    AggroComponent,
    AggroMode,
} from "../componentOld/actor/mob/aggroComponent.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { DestroyOnZeroHealthComponent } from "../componentOld/health/destroyOnZeroHealthComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import { JobRunnerComponent } from "../componentOld/job/jobRunnerComponent.js";
import { StaticSelectionInfoProvider } from "../componentOld/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../componentOld/selection/selectionInfoComponent.js";
import { Entity } from "../entity/entity.js";

export function mobPrefab(id: string): Entity {
    const goblin = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.goblin,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );
    const aggroComponent = new AggroComponent(2);
    aggroComponent.aggroMode = AggroMode.Agressive;
    const jobRunnerComponent = new JobRunnerComponent();
    const idleMobComponent = new IdleMobComponent();
    const healthComponent = new HealthComponent(100, 100);
    const selectionInfo = new SelectionInfoComponent(
        new StaticSelectionInfoProvider(sprites2.goblin, "Goblin", "Hostile"),
    );
    jobRunnerComponent.isOpenForExternalJobs = false;

    goblin.addComponent(idleMobComponent);
    goblin.addComponent(jobRunnerComponent);
    goblin.addComponent(spriteDrawer);
    goblin.addComponent(healthComponent);
    goblin.addComponent(aggroComponent);
    goblin.addComponent(selectionInfo);
    goblin.addComponent(new DestroyOnZeroHealthComponent());

    return goblin;
}
