/**
 * Marker component stamped on a goblin that has been committed to a night
 * raid by formGoblinRaid. Its presence is the single source of truth that
 * RaidBehavior reads — it is decided once at raid formation and lives until
 * the goblin dies (there is no retreat). A goblin without this component is
 * not a raider (e.g. the fire-tender left behind, or a goblin spawned after
 * the warband already left).
 */
export type RaidingComponent = {
    id: typeof RaidingComponentId;

    /**
     * Entity id of the player building this raider is currently assigned to
     * raze. Assigned at formation; re-pointed by RaidBehavior when the target
     * is destroyed and other player buildings remain.
     */
    targetId: string;
};

export const RaidingComponentId = "Raiding";

export function createRaidingComponent(targetId: string): RaidingComponent {
    return {
        id: RaidingComponentId,
        targetId,
    };
}
