import { Bounds } from "../../common/bounds.js";
import { Point } from "../../common/point.js";
import { Entity } from "../../game/entity/entity.js";

/**
 * Represent as set of tiles that can be unlocked
 */
export type Tileset = {
    /**
     * The position of the tiles in this set
     */
    tiles: Point[];
    /**
     * The bounds of these tiles
     */
    bounds: Bounds;
    /**
     *
     */
    entities: Entity[];
};
