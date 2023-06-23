/**
 * A special constant symbolising that the size should depend on the size of
 * its children/content
 */ export const wrapUiSize = -1;
/**
 * A special constant symbolising that the size should depend on the size of
 * the constaints provided by the parent
 */ export const fillUiSize = -2;
/**
 * Check if a given UISize's width and height matches another UISize's
 * width and height
 * @param firstSize first size
 * @param secondSize second size
 * @returns if the size is equal
 */ export function UISizeEquals(firstSize, secondSize) {
    return firstSize.width == secondSize.width && firstSize.height == secondSize.height;
}
/**
 * Create a new UISize that has its components set to zero
 * @returns the zero sided UISize
 */ export function zeroSize() {
    return {
        width: 0,
        height: 0
    };
}
