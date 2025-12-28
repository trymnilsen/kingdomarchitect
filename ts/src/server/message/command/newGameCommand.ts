export type NewGameCommand = {
    id: typeof NewGameCommandId;
};

export function NewGameCommand(): NewGameCommand {
    return {
        id: NewGameCommandId,
    };
}

export const NewGameCommandId = "newgame";
