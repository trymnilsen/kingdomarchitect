/**
 * A special constant symbolising that the size should depend on the size of
 * its children/content
 */
export const wrapUiSize = -1;
/**
 * A special constant symbolising that the size should depend on the size of
 * the constaints provided by the parent
 */
export const fillUiSize = -2;
/**
 * Represents the size of an UI. Will also be used for the _wanted_ size of
 * a UI where width and height can be less than zero. See `fillUiSize` and
 * `wrapUiSize` for further details on these to magic numbers.
 */
export interface UISize {
    height: number;
    width: number;
}

/**
 * Check if a given UISize's width and height matches another UISize's
 * width and height
 * @param firstSize first size
 * @param secondSize second size
 * @returns if the size is equal
 */
export function UISizeEquals(firstSize: UISize, secondSize: UISize): boolean {
    return (
        firstSize.width == secondSize.width &&
        firstSize.height == secondSize.height
    );
}

/**
 * Create a new UISize that has its components set to zero
 * @returns the zero sided UISize
 */
export function zeroSize(): UISize {
    return {
        width: 0,
        height: 0,
    };
}
