import { Bounds } from "../../common/bounds";
import { Point } from "../../common/point";
import { GroundTile } from "../../game/world/component/tile/tilesComponent";
import { Entity } from "../../game/world/entity/entity";

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
    createTiles(): GroundTile[];
    createEntities(): Entity[];
}
