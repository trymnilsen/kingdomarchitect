export const Adjacency = {
    Left: "left",
    Right: "right",
    Upper: "upper",
    Bottom: "bottom",
    LeftRight: "leftright",
    LeftRightUpper: "leftrightupper",
    LeftUpper: "leftupper",
    LeftBottom: "leftbottom",
    LeftUpperBottom: "leftupperbottom",
    LeftRightBottom: "leftrightbottom",
    LeftRightUpperBottom: "leftrightupperbottom",
    RightUpper: "rightupper",
    RightUpperBottom: "rightupperbottom",
    RightBottom: "rightbottom",
    UpperBottom: "upperbottom",
    None: "none",
} as const;

export type Adjacency = (typeof Adjacency)[keyof typeof Adjacency];

/**
 * A more flexible adjacency structure that tracks each direction independently
 */
export type AdjacencyMask = {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
};

/**
 * Convert an AdjacencyMask to the legacy Adjacency enum for compatibility
 */
export function adjacencyMaskToEnum(mask: AdjacencyMask): Adjacency {
    const { left, right, up, down } = mask;

    if (left && right && up && down) return Adjacency.LeftRightUpperBottom;
    if (left && right && up && !down) return Adjacency.LeftRightUpper;
    if (left && right && !up && down) return Adjacency.LeftRightBottom;
    if (left && !right && up && down) return Adjacency.LeftUpperBottom;
    if (!left && right && up && down) return Adjacency.RightUpperBottom;
    if (left && right && !up && !down) return Adjacency.LeftRight;
    if (!left && !right && up && down) return Adjacency.UpperBottom;
    if (left && !right && up && !down) return Adjacency.LeftUpper;
    if (left && !right && !up && down) return Adjacency.LeftBottom;
    if (!left && right && up && !down) return Adjacency.RightUpper;
    if (!left && right && !up && down) return Adjacency.RightBottom;
    if (left && !right && !up && !down) return Adjacency.Left;
    if (!left && right && !up && !down) return Adjacency.Right;
    if (!left && !right && up && !down) return Adjacency.Upper;
    if (!left && !right && !up && down) return Adjacency.Bottom;

    // Default fallback
    return Adjacency.None;
}

/**
 * Create an AdjacencyMask from boolean values
 */
export function createAdjacencyMask(
    left: boolean = false,
    right: boolean = false,
    up: boolean = false,
    down: boolean = false,
): AdjacencyMask {
    return { left, right, up, down };
}
