import { Bounds } from "../../common/bounds.js";
import { Point } from "../../common/point.js";
import { GroundTile } from "../../game/world/component/tile/tilesComponent.js";
import { Entity } from "../../game/world/entity/entity.js";

/**
 * Represent as set of tiles that can be unlocked
 */
export interface Tileset {
    /**
     * The position of the tiles in this set
     */
    tiles: Point[];
    /**
     * The bounds of these tiles
     */
    bounds: Bounds;
    /*
     * A name for the tileset, should not be considered unique
     */
    name: string;
    /**
     * A factory that creates the tiles and entities needed
     * if this set is unlocked
     */
    factory: TileSetFactory;
}

/**
 * A factory to create the tiles and entities for a given unlockable
 * aera. Different tilesets might have different factories, allowing both
 * fixed areas and avoiding the need to create the entities of an area
 * while previewing it for purchase
 */
export interface TileSetFactory {
    /**
     * Any tiles that should be added once the tilset has been unlocked
     */
    createTiles(): GroundTile[];
    /**
     * Any entities that should be added once the tilset has been unlocked
     */
    createEntities(): Entity[];
}
