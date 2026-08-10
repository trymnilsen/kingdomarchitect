import {
    INITIAL_RAID_THRESHOLD_BASE,
    RAID_MIN_HOUSES,
} from "./raidConstants.ts";
import { worthOfKingdom } from "./raidWorth.ts";

/**
 * Camp size as a function of kingdom score. Each row means: once the kingdom
 * reaches the worth of the settlement described, the camp supports `size`
 * goblins. One goblin always stays home as defender when a raid forms, so
 * `size: 3` means a raid party of 2. The last row is the hard ceiling on camp
 * size.
 *
 * The second row is anchored to the raid constants on purpose: the camp
 * becomes raid-capable (RAID_MIN_HOUSES) at exactly the score where the
 * kingdom becomes worth raiding (the worth of FIRST_RAID_KINGDOM). Below that
 * the camp is one goblin short of the raid floor and never marches. The later
 * steps widen so the camp always lags well behind the kingdom's growth.
 */
export const campSizeSteps = [
    { atScore: 0, size: RAID_MIN_HOUSES - 1 },
    { atScore: INITIAL_RAID_THRESHOLD_BASE, size: RAID_MIN_HOUSES },
    {
        atScore: worthOfKingdom({
            workers: 16,
            houses: 8,
            stockpiles: 2,
            otherBuildings: 5,
        }),
        size: 4,
    },
    {
        atScore: worthOfKingdom({
            workers: 22,
            houses: 11,
            stockpiles: 3,
            otherBuildings: 10,
        }),
        size: 5,
    },
    {
        atScore: worthOfKingdom({
            workers: 30,
            houses: 15,
            stockpiles: 4,
            otherBuildings: 15,
        }),
        size: 6,
    },
    {
        atScore: worthOfKingdom({
            workers: 40,
            houses: 20,
            stockpiles: 5,
            otherBuildings: 20,
        }),
        size: 7,
    },
    {
        atScore: worthOfKingdom({
            workers: 50,
            houses: 26,
            stockpiles: 6,
            otherBuildings: 27,
        }),
        size: 8,
    },
    {
        atScore: worthOfKingdom({
            workers: 62,
            houses: 32,
            stockpiles: 8,
            otherBuildings: 32,
        }),
        size: 9,
    },
    {
        atScore: worthOfKingdom({
            workers: 75,
            houses: 40,
            stockpiles: 10,
            otherBuildings: 35,
        }),
        size: 10,
    },
];

/** The camp size the given kingdom score supports: the last step reached. */
export function campSizeForScore(score: number): number {
    let size = campSizeSteps[0].size;
    for (const step of campSizeSteps) {
        if (score < step.atScore) {
            break;
        }
        size = step.size;
    }
    return size;
}
