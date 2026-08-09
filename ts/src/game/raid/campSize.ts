import {
    INITIAL_RAID_THRESHOLD_BASE,
    RAID_MIN_HOUSES,
} from "./raidConstants.ts";

/**
 * Camp size as a function of kingdom score. Each row means: once the kingdom
 * score reaches `atScore`, the camp supports `size` goblins. One goblin always
 * stays home as defender when a raid forms, so `size: 3` means a raid party
 * of 2. The last row is the hard ceiling on camp size.
 *
 * The second row is anchored to the raid constants on purpose: the camp
 * becomes raid-capable (RAID_MIN_HOUSES) at exactly the score where the
 * kingdom becomes worth raiding (INITIAL_RAID_THRESHOLD_BASE). Below that the
 * camp is one goblin short of the raid floor and never marches. The later
 * steps widen so the camp always lags well behind the kingdom's growth.
 */
export const campSizeSteps = [
    { atScore: 0, size: RAID_MIN_HOUSES - 1 },
    { atScore: INITIAL_RAID_THRESHOLD_BASE, size: RAID_MIN_HOUSES },
    { atScore: 600, size: 4 },
    { atScore: 1000, size: 5 },
    { atScore: 1500, size: 6 },
    { atScore: 2100, size: 7 },
    { atScore: 2800, size: 8 },
    { atScore: 3600, size: 9 },
    { atScore: 4500, size: 10 },
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
