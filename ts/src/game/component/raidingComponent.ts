/**
 * Marker component stamped on a goblin that has been committed to a night
 * raid by formGoblinRaid. RaidBehavior reads its presence and nothing else.
 * Membership is decided once at raid formation and lasts until the goblin dies,
 * since there is no retreat. A goblin without it is not a raider: the
 * fire-tender left behind, or one spawned after the warband set out.
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
