import { World } from "../world/world.js";
import { spawnAnimalsRoutine } from "./spawnAnimalsRoutine.js";
import { spawnMobRoutine } from "./spawnMobRoutine.js";

export type SpawnRoutine = (tick: number, world: World) => void;

export const spawnRoutines: SpawnRoutine[] = [
    spawnAnimalsRoutine,
    spawnMobRoutine,
];
