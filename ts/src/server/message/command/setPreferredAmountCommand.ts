export type SetPreferredAmountCommand = {
    id: typeof SetPreferredAmountCommandId;
    stockpileEntityId: string;
    itemId: string;
    /** Amount to set as preferred. 0 removes the preference. */
    amount: number;
};

export function SetPreferredAmountCommand(
    stockpileEntityId: string,
    itemId: string,
    amount: number,
): SetPreferredAmountCommand {
    return {
        id: SetPreferredAmountCommandId,
        stockpileEntityId,
        itemId,
        amount,
    };
}

export const SetPreferredAmountCommandId = "setPreferredAmount";
