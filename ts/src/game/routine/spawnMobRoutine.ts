import { MobActor } from "../actor/actors/mobActor";
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

    world.actors.addActor(mobActor);
}
