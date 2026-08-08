/**
 * Shared tuning constants for the goblin night-raid feature. Kept in one place
 * so the siege pathfinding cost, the combat damage split, and the raid
 * formation/behavior all agree on the same numbers.
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

/**
 * Raid value used for a player building that does not declare one. Buildings
 * with an explicit raidValue of 0 (walls, gates, roads) are never chosen as
 * objectives — they are only broken through as obstacles by the siege path.
 */
export const DEFAULT_RAID_VALUE = 20;

/** Soft cap on how many raiders are assigned to a single target before stacking. */
export const RAIDERS_PER_TARGET = 2;

/**
 * Utility of RaidBehavior. Below engageInCombat (90) so a raider that is
 * attacked defends itself first, then resumes the siege; above keepWarm/idle.
 */
export const RAID_UTILITY = 50;

/**
 * What one player worker adds to the kingdom score. Set to DEFAULT_RAID_VALUE so
 * a worker is worth exactly one generic building, which keeps the score readable
 * as "how much is there here to take".
 */
export const WORKER_SCORE = 20;

/**
 * Factor applied to the kingdom score when a camp restamps its threshold after
 * raiding. The kingdom must grow 25% past what it was worth on raid night before
 * that same camp marches again, so prosperity itself is the cooldown.
 */
export const RAID_THRESHOLD_GROWTH = 1.25;

/**
 * Kingdom score a camp at zero distance waits for before its first raid. This is
 * the early-game grace period, calibrated against a starting kingdom: 6 workers
 * (120) plus a house (60) plus a stockpile (100).
 */
export const INITIAL_RAID_THRESHOLD_BASE = 280;

/**
 * Added to a camp's initial threshold per tile of distance from the kingdom.
 * Every camp reads the same score, so without this spread they would all cross a
 * shared bar on the same night. Near camps covet the kingdom sooner; far ones
 * need a richer prize to march for.
 */
export const RAID_THRESHOLD_DISTANCE_FACTOR = 2;

/**
 * Kingdom score needed per goblin a camp can support, so its cap is roughly
 * score / 80. Calibrated to preserve the old sizing: a mid-game kingdom of 6
 * workers, 3 houses and a stockpile scores 400 and yields a cap of 5.
 */
export const CAMP_SIZE_SCORE_DIVISOR = 80;

/**
 * Camps below this size never raid, which keeps a raid party from degenerating
 * to 0–1 goblins. The early-game grace period lives in
 * INITIAL_RAID_THRESHOLD_BASE, not here.
 */
export const RAID_MIN_HOUSES = 3;

/**
 * A camp always supports at least this many goblins, even with no kingdom score
 * to size against — so a camp is never sized to 0 and always sustains its lone
 * starting goblin. Kept below RAID_MIN_HOUSES so a minimum-size camp never raids.
 */
export const GOBLIN_CAMP_MIN_SIZE = 1;

/**
 * Hard ceiling on a camp's tracked size, so a large kingdom can't drive an
 * unbounded goblin force (building footprint, perf, winnability).
 */
export const GOBLIN_HOUSE_CAP = 10;
