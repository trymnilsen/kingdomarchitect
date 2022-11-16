import { World } from "../world";
import { spawnAnimalsRoutine } from "./spawnAnimalsRoutine";
import { spawnMobRoutine } from "./spawnMobRoutine";

export type SpawnRoutine = (tick: number, world: World) => void;

export const spawnRoutines: SpawnRoutine[] = [
    spawnAnimalsRoutine,
    spawnMobRoutine,
];
