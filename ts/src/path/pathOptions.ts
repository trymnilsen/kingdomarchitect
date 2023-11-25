export type PathOptions = {
    /**
     * Allow a partial path between A and B
     * Defaults to true if not set.
     */
    allowPartial?: boolean;
    /**
     * Allow stopping adjacent to Point B, on a path from A to B.
     * Defaults to false if not set
     */
    allowAdjacent?: boolean;
};
