import { type KingdomDescription, worthOfKingdom } from "./raidWorth.ts";

/**
 * Shared tuning constants for the goblin night-raid feature. Kept in one place
 * so the siege pathfinding cost, the combat damage split, and the raid
 * formation/behavior all agree on the same numbers. What individual things are
 * worth to a raider lives in raidWorth.ts; this file is pacing policy.
 */

/**
 * Damage dealt per tick when attacking a building (structure). Goblin raiders
 * use this to raze the player's settlement at a meaningful pace; it also lets
 * the player raze a goblin campfire faster when counter-raiding a camp.
 *
 * TODO: this is a blunt instrument — a flat structure-damage bonus applied to
 * any attacker. Revisit with a proper damage model (per-unit attack stats,
 * siege weapons, building armor) instead of a single global constant.
 */
export const STRUCTURE_DAMAGE = 10;

/** Damage dealt per tick when attacking a unit (non-building). Unchanged. */
export const UNIT_DAMAGE = 1;

/**
 * Multiplier on the siege-path cost of routing through a destructible
 * structure. Cost ≈ SIEGE_COST_MULTIPLIER * (building maxHp / STRUCTURE_DAMAGE),
 * compared against ~2 per ground tile. Higher → raiders prefer detours; lower →
 * they punch through walls more eagerly. At 1.0 a 100hp wall (≈10 cost) is worth
 * breaching whenever going around would be more than ~5 tiles.
 */
export const SIEGE_COST_MULTIPLIER = 1.0;

/** Soft cap on how many raiders are assigned to a single target before stacking. */
export const RAIDERS_PER_TARGET = 2;

/**
 * Utility of RaidBehavior. Below engageInCombat (90) so a raider that is
 * attacked defends itself first, then resumes the siege; above keepWarm/idle.
 */
export const RAID_UTILITY = 50;

/**
 * Factor applied to the kingdom score when a camp restamps its threshold after
 * raiding. The kingdom must grow 25% past what it was worth on raid night before
 * that same camp marches again, so prosperity itself is the cooldown.
 */
export const RAID_THRESHOLD_GROWTH = 1.25;

/**
 * The settlement goblins consider worth a first raid. The threshold below is
 * derived from this description, so the calibration question is always "does
 * this look like the kingdom the first raid should land on?", never "what does
 * 700 mean?". For scale: a fresh game starts at 1 worker, a house, a farm, a
 * stockpile and a cresset, which is worth 220.
 */
export const FIRST_RAID_KINGDOM: KingdomDescription = {
    workers: 12,
    houses: 5,
    stockpiles: 1,
    otherBuildings: 3,
};

/**
 * Kingdom score a camp at zero distance waits for before its first raid: the
 * worth of FIRST_RAID_KINGDOM. The gap between the starting kingdom and this
 * bar is the early-game grace period.
 */
export const INITIAL_RAID_THRESHOLD_BASE = worthOfKingdom(FIRST_RAID_KINGDOM);

/**
 * Added to a camp's initial threshold per tile of distance from the kingdom.
 * Every camp reads the same score, so without this spread they would all cross a
 * shared bar on the same night. Near camps covet the kingdom sooner; far ones
 * need a richer prize to march for.
 */
export const RAID_THRESHOLD_DISTANCE_FACTOR = 2;

/**
 * Camps below this size never raid, which keeps a raid party from degenerating
 * to 0–1 goblins. The camp size table (campSizeSteps) is anchored to it: a camp
 * sits at RAID_MIN_HOUSES - 1 until the kingdom crosses the first raid
 * threshold, so the floor is structural rather than a safety net. The
 * early-game grace period lives in INITIAL_RAID_THRESHOLD_BASE, not here.
 */
export const RAID_MIN_HOUSES = 3;

/**
 * A fresh camp starts out supporting this many goblins, just its lone starting
 * goblin, until goblinCampSystem sizes it from the camp size table. Kept below
 * RAID_MIN_HOUSES so a minimum-size camp never raids.
 */
export const GOBLIN_CAMP_MIN_SIZE = 1;
