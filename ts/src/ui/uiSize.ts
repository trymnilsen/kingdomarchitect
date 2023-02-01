export interface UISize {
    height: number;
    width: number;
}

export function UISizeEquals(firstSize: UISize, secondSize: UISize): Boolean {
    return (
        firstSize.width == secondSize.width &&
        firstSize.height == secondSize.height
    );
}

export function zeroSize(): UISize {
    return {
        width: 0,
        height: 0,
    };
}
