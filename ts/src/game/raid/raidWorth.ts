import { woodenHouse } from "../../data/building/wood/house.ts";
import { stockPile } from "../../data/building/wood/storage.ts";

/**
 * Raid value used for a player building that does not declare one. Buildings
 * with an explicit raidValue of 0 (walls, gates, roads) are never chosen as
 * objectives — they are only broken through as obstacles by the siege path.
 */
export const DEFAULT_RAID_VALUE = 20;

/**
 * What one player worker adds to the kingdom score. Set to DEFAULT_RAID_VALUE so
 * a worker is worth exactly one generic building, which keeps the score readable
 * as "how much is there here to take".
 */
export const WORKER_SCORE = 20;

/**
 * A settlement described in things you can picture, used to express raid pacing
 * values as kingdoms instead of bare scores.
 */
export type KingdomDescription = {
    workers: number;
    houses: number;
    stockpiles: number;
    /** Buildings with no declared raidValue: farms, cressets, workshops, ... */
    otherBuildings: number;
};

/**
 * What a kingdom of this shape is worth to a goblin, in the same currency as
 * the live kingdomScore. Lets pacing constants be written as settlements you
 * can picture instead of bare numbers, and keeps them honest: retuning a
 * building's raidValue moves every threshold expressed through this.
 */
export function worthOfKingdom(description: KingdomDescription): number {
    return (
        description.workers * WORKER_SCORE +
        description.houses * (woodenHouse.raidValue ?? DEFAULT_RAID_VALUE) +
        description.stockpiles * (stockPile.raidValue ?? DEFAULT_RAID_VALUE) +
        description.otherBuildings * DEFAULT_RAID_VALUE
    );
}
