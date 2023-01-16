import { Point } from "../../../../../common/point";

/**
 * Status of a path search result
 */
export enum PathResultStatus {
    /**
     * A complete path was found including the end point
     */
    Complete = "complete",
    /**
     * A complete path was found excluding the end point.
     * There might be multiple tiles between the end point of the search
     * and the target if the target is withing an entity spanning multiple
     * tiles. In this case the final point in the path will be a tile adjacent
     * to the bounds of this entity
     */
    Adjacent = "adjacent",
    /**
     * A partial path was found to the end point. Use with caution as it is not
     * a complete path
     */
    Partial = "partial",
    /**
     * No path was found from start to end. For example if the start was inside
     * a impassable position
     */
    None = "none",
}

/**
 * The result of a path search, will include the potential path found and the
 * status of the search. Note: A result with entries in the path array might
 * not be a complete path, remember to check the status
 */
export interface PathResult {
    path: Point[];
    status: PathResultStatus;
}
