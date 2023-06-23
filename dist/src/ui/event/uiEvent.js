export const tapStartType = "tapStart";
export const tapType = "tap";
export const tapUpType = "tapUp";
export const directionInputType = "direction";
export function isTapEvent(uiEvent) {
    return uiEvent.type == tapStartType || uiEvent.type == tapType || uiEvent.type == tapUpType;
}
