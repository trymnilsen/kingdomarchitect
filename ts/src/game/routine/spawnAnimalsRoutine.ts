import { randomEntry } from "../../common/array";
import { FoxActor } from "../actor/actors/foxActor";
import { World } from "../world";

export function spawnAnimalsRoutine(tick: number, world: World) {
    if (tick % 10 != 0) {
        return;
    }
    const existingAnimals = world.actors.getActors(
        (actor) => actor instanceof FoxActor
    );
    if (existingAnimals.length > 4) {
        return;
    }
    const treeTiles = world.ground.getTiles((tile) => !!tile.hasTree);
    const spawnPosition = randomEntry(treeTiles);

    const foxActor = new FoxActor({
        x: spawnPosition.tileX,
        y: spawnPosition.tileY,
    });

    world.actors.addActor(foxActor);
}
