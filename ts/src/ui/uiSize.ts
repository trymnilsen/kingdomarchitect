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
 * The size of a UI element, and also the _wanted_ size of one.
 *
 * A negative width or height carries meaning rather than describing pixels.
 * See `fillUiSize` and `wrapUiSize` for what the two magic numbers ask the
 * layout pass to do.
 *
 * This type belongs to the UI layer because of those magic numbers. A plain
 * width and height pair looks like a candidate for `common/`, and moving it
 * there would drag the layout contract along with it. Declare a local
 * `{ width, height }` instead when all a module needs is two numbers.
 */
export type UISize = {
    height: number;
    width: number;
};

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
