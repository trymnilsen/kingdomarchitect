import { MobActor } from "../actor/actors/mobActor";
import { ActorInstanceJobConstraint } from "../actor/job/constraint/actorInstanceConstraint";
import { MoveJob } from "../actor/jobs/moveJob";
import { World } from "../world";

export function spawnMobRoutine(tick: number, world: World) {
    if (tick % 20 != 0) {
        return;
    }
    const existingAnimals = world.actors.getActors(
        (actor) => actor instanceof MobActor
    );
    if (existingAnimals.length > 0) {
        return;
    }
    const spawnPosition = world.ground.getRandomBoundsPosition();

    const mobActor = new MobActor({
        x: spawnPosition.x,
        y: spawnPosition.y,
    });

    const path = world.findPath(spawnPosition, {
        x: 4,
        y: 4,
    });

    world.actors.addActor(mobActor);
    world.actors.jobQueue.schedule(
        new MoveJob(path, new ActorInstanceJobConstraint(mobActor))
    );
}
