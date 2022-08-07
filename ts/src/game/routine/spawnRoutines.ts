import { World } from "../world";
import { spawnAnimalsRoutine } from "./spawnAnimalsRoutine";

export type SpawnRoutine = (tick: number, world: World) => void;

export const spawnRoutines: SpawnRoutine[] = [spawnAnimalsRoutine];
