import { ImageAsset } from "../../../asset/assets";
import { Sprite, spriteWithSize } from "../../../asset/sprite";
import { stoneWoodWalls } from "../../../asset/sprites/stoneWoodWalls";
import { Direction } from "../../../common/direction";
import { adjacentPoint } from "../../../common/point";
import { BuildableEntity } from "../buildableEntity";

export class WallEntity extends BuildableEntity {
    requestSpriteUpdate() {
        const adjacentTiles = this.getAdjacentTiles();
        this.updateSpriteWithAdjacency(adjacentTiles);
    }

    override onBuildEnded() {
        //The build was ended so we should look for entities in the adjacent
        //tiles to know both which sprite we should use for this wall
        //and if we should update the sprite of any of the adjacent walls
        //connecting to this wall
        const adjacentTiles = this.getAdjacentTiles();
        //Update the state of potentialy adjacent tiles
        adjacentTiles.north?.requestSpriteUpdate();
        adjacentTiles.west?.requestSpriteUpdate();
        adjacentTiles.east?.requestSpriteUpdate();
        adjacentTiles.south?.requestSpriteUpdate();

        //Update the sprite of this tile
        this.updateSpriteWithAdjacency(adjacentTiles);
    }

    private updateSpriteWithAdjacency(adjacentTiles: AdjacentTiles) {
        const spriteKey = adjacentSpriteKey(adjacentTiles);
        const directionalSprite = wallSprites[spriteKey];
        if (directionalSprite) {
            this.buildingSprite = directionalSprite;
            this.buildingOffset = {
                x: 0,
                y: 0,
            };
        } else {
            if (spriteKey != "") {
                console.log("No sprite found for", spriteKey);
            }
            this.buildingSprite = stoneWoodWalls;
            this.buildingOffset = {
                x: 2,
                y: 2,
            };
        }
    }

    private getAdjacentTiles(): AdjacentTiles {
        const position = this.tilePosition;
        const adjacentNorthPoint = adjacentPoint(position, Direction.Up);
        const adjacentWestPoint = adjacentPoint(position, Direction.Left);
        const adjacentEastPoint = adjacentPoint(position, Direction.Right);
        const adjacentSouthPoint = adjacentPoint(position, Direction.Down);

        const northTile = this.world.entities.getTile(adjacentNorthPoint);
        const westTile = this.world.entities.getTile(adjacentWestPoint);
        const eastTile = this.world.entities.getTile(adjacentEastPoint);
        const southTile = this.world.entities.getTile(adjacentSouthPoint);
        const adjacentTiles: AdjacentTiles = {
            north: null,
            west: null,
            east: null,
            south: null,
        };

        if (northTile && northTile instanceof WallEntity) {
            adjacentTiles.north = northTile;
        }

        if (westTile && westTile instanceof WallEntity) {
            adjacentTiles.west = westTile;
        }

        if (eastTile && eastTile instanceof WallEntity) {
            adjacentTiles.east = eastTile;
        }

        if (southTile && southTile instanceof WallEntity) {
            adjacentTiles.south = southTile;
        }

        return adjacentTiles;
    }
}

const wallSprites = {
    north: wallSprite("stoneWoodWallsUp"),
    west: wallSprite("stoneWoodWallsLeft"),
    east: wallSprite("stoneWoodWallsRight"),
    south: wallSprite("stoneWoodWallsDown"),
    northwest: wallSprite("stoneWoodWallsLeftUp"),
    northeast: wallSprite("stoneWoodWallsUpRight"),
    northsouth: wallSprite("stoneWoodWallsVeritcal"),
    northwesteast: wallSprite("stoneWoodWallsLeftUpRight"),
    northwestsouth: wallSprite("stoneWoodWallsLeftUpBottom"),
    northeastsouth: wallSprite("stoneWoodWallsUpBottomRight"),
    northwesteastsouth: wallSprite("stoneWoodWallsLeftUpRightBottom"),
    westeast: wallSprite("stoneWoodWallsHorizontal"),
    westsouth: wallSprite("stoneWoodWallsLeftBottom"),
    westeastsouth: wallSprite("stoneWoodwallsLeftBottomRight"),
    eastsouth: wallSprite("stoneWoodWallsBottomRight"),
};

type AdjacentTiles = {
    north: WallEntity | null;
    west: WallEntity | null;
    east: WallEntity | null;
    south: WallEntity | null;
};

function adjacentSpriteKey(adjacentTile: AdjacentTiles): string {
    let spriteKey = "";
    if (adjacentTile.north) {
        spriteKey += "north";
    }
    if (adjacentTile.west) {
        spriteKey += "west";
    }
    if (adjacentTile.east) {
        spriteKey += "east";
    }
    if (adjacentTile.south) {
        spriteKey += "south";
    }

    return spriteKey;
}

function wallSprite(asset: ImageAsset): Sprite {
    return spriteWithSize(asset, 40, 40);
}
