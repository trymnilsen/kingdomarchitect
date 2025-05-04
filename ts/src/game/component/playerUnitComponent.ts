export type PlayerUnitComponent = {
    id: typeof PlayerUnitComponentId;
};

export function createPlayerUnitComponent(): PlayerUnitComponent {
    return {
        id: PlayerUnitComponentId,
    };
}

export const PlayerUnitComponentId = "PlayerUnit";
