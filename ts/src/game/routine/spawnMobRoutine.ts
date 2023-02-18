import { AttackBuildingJob } from "../world/actor/jobs/attack/attackBuildingJob";
import { World } from "../world/world";

export function spawnMobRoutine(tick: number, world: World) {
    //TODO: add back spawn mob routine
    /*
    if (tick % 20 != 0) {
        return;
    }
    const existingMob = world.actors.getActors(
        (actor) => actor instanceof MobActor
    );
    if (existingMob.length > 0) {
        return;
    }
    const spawnPosition = {
        x: 4,
        y: 0,
    };

    const mobActor = new MobActor(spawnPosition);
    const building = world.entities.getTile({ x: 3, y: 3 });
    //const pathResult = world.findPath(spawnPosition, toPosition, true);
    const job = new AttackBuildingJob(building, mobActor);
    world.actors.addActor(mobActor);
    world.actors.jobQueue.schedule(job);
    */
}
