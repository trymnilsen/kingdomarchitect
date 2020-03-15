import { Renderer } from "./rendering/renderer";
import { Input, InputEvent } from "../input/input";
import { rectangle } from "./rendering/items/rectangle";
import {
    Chunk,
    getChunks,
    TILESIZE,
    CHUNKSIZE,
    TOTALTILES,
    NUMBEROFTILES,
    Volume,
    NUMBEROFCHUNKS,
    incrementAndGetVolumeId,
    TOTALTILESMINUSONE,
    NUMBEROFTILESMINUSONE
} from "../state/state";
import { RenderNode, container } from "./rendering/items/renderNode";
import { Point, changeX, changeY } from "../data/point";
import { InputActionData } from "../input/inputAction";
import { rgbToHex } from "../util/color";
import { text } from "./rendering/items/text";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private chunks: Chunk[];
    private cameraPosition: Point = {
        x: 0,
        y: 0
    };
    public constructor(domElementWrapperSelector: string) {
        this.chunks = getChunks();
        this.input = new Input();
        //Input
        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            console.log("Pre camera pos: ", this.cameraPosition);
            this.cameraPosition = updateCamera(this.cameraPosition, inputEvent);
            console.log("post camera pos: ", this.cameraPosition);
            this.update();
        });

        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        canvasElement.addEventListener("click", (clickEvent) => {
            console.log("ClickEvent: ", clickEvent.clientX, clickEvent.clientY);
            const worldSpaceClickPoint = this.renderer.camera.screenToWorldSpace(
                {
                    x: clickEvent.clientX,
                    y: clickEvent.clientY
                }
            );
            this.toggleWall(worldSpaceClickPoint);
        });

        this.renderer = new Renderer(canvasElement);
        this.renderer.camera.center(this.cameraPosition);
        //this.renderer.camera.follow(getPlayerPosition(this.state));
        this.render();
    }
    private toggleWall(worldPoint: Point) {
        const chunkX = Math.floor(worldPoint.x / NUMBEROFTILES);
        const chunkY = Math.floor(worldPoint.y / NUMBEROFTILES);
        const chunkId = chunkY * NUMBEROFCHUNKS + chunkX;
        const tileX = worldPoint.x % NUMBEROFTILES;
        const tileY = worldPoint.y % NUMBEROFTILES;
        const tileIndex = tileY * NUMBEROFTILES + tileX;
        console.log("Toggle Wall", {
            worldPoint,
            chunkX,
            chunkY,
            chunkId,
            tileX,
            tileY,
            tileIndex
        });
        const currentBlock = this.chunks[chunkId].blocks[tileIndex];
        if (currentBlock == 0) {
            this.chunks[chunkId].volumes[tileIndex] = -1;
            this.chunks[chunkId].blocks[tileIndex] = 1;
        } else {
            this.chunks[chunkId].blocks[tileIndex] = 0;
        }
        const startVolume = performance.now();
        updateVolumes(this.chunks[chunkId]);
        const endVolume = performance.now();
        console.log("Volume update Time used: ", endVolume - startVolume);
        this.update();
    }
    private update() {
        this.renderer.camera.center(this.cameraPosition);
        //this.renderer.camera.follow(this.cameraPosition);
        this.render();
    }

    private render() {
        const getRenderNodesStart = performance.now();
        const nodes = getRenderNodesForChunks(this.chunks);
        const getRenderNodesEnd = performance.now();
        console.log(
            "Get RenderNodes: ",
            getRenderNodesEnd - getRenderNodesStart
        );
        const renderStart = performance.now();
        this.renderer.render(nodes);
        const renderEnd = performance.now();
        console.log("render time: ", renderEnd - renderStart);
    }

    public dispose(): any {}
}

function getRenderNodesForChunks(chunks: Chunk[]): RenderNode {
    const rootNode = container({
        x: 0,
        y: 0
    });
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkX = CHUNKSIZE * chunk.x;
        const chunkY = CHUNKSIZE * chunk.y;
        const chunkOutline = rectangle({
            x: chunkX,
            y: chunkY,
            strokeWidth: 4,
            strokeColor: "green",
            width: CHUNKSIZE,
            height: CHUNKSIZE
        });
        rootNode.children.push(chunkOutline);

        for (let t = 0; t < TOTALTILES; t++) {
            const tileContainer = container({
                x: chunkX + (t % NUMBEROFTILES) * TILESIZE,
                y: chunkY + Math.floor(t / NUMBEROFTILES) * TILESIZE
            });
            if (chunk.blocks[t] === 0) {
                const tile = rectangle({
                    depth: -10,
                    x: 2,
                    y: 2,
                    width: TILESIZE - 2,
                    height: TILESIZE - 2,
                    fill: rgbToHex(100, 125, 100)
                });
                tileContainer.children.push(tile);
            }

            const volumeText = text({
                text: `V${chunk.volumes[t]}`,
                x: 8,
                y: 20,
                color: "black"
            });
            const roomText = text({
                text: "R1",
                x: 8,
                y: 36,
                color: "black"
            });
            const blockText = text({
                text: `T${t}`,
                x: 8,
                y: 52,
                color: "black"
            });

            tileContainer.children.push(volumeText);
            tileContainer.children.push(roomText);
            tileContainer.children.push(blockText);
            rootNode.children.push(tileContainer);
        }
    }
    return rootNode;
}

function updateCamera(currentPosition: Point, inputEvent: InputEvent): Point {
    switch (inputEvent.action) {
        case InputActionData.LEFT_PRESS:
            return changeX(currentPosition, -1);
        case InputActionData.RIGHT_PRESS:
            return changeX(currentPosition, 1);
        case InputActionData.UP_PRESS:
            return changeY(currentPosition, -1);
        case InputActionData.DOWN_PRESS:
            return changeY(currentPosition, 1);
        default:
            return currentPosition;
    }
}

interface VolumeSearchResult {
    visitedTiles: number[];
    volumeIds: number[];
}

function updateVolumes(chunk: Chunk) {
    //Add the indexes of all tiles in the chunk that are not completely blocked
    const availableBlocks: number[] = [];
    //Precalculate the sizes of each volume as we are already iterating over
    //the tilemap below
    const volumeSizes: { [tile: number]: number } = {};
    for (let t = 0; t < TOTALTILES; t++) {
        incrementInMap(volumeSizes, chunk.volumes[t].toString());
        if (chunk.blocks[t] === 0) {
            availableBlocks.push(t);
        }
    }
    console.log(
        `Updating volume in chunk ${chunk.x}/${chunk.y}. Available blocks:`,
        availableBlocks
    );
    //Commenting this quite extensively as i might forget this in a couple
    //of week/months... years?
    const volumes: VolumeSearchResult[] = [];

    while (availableBlocks.length > 0) {
        //List of indexes of tiles we have currently visited
        let visitedTiles: number[] = [];
        //list of volumne ids for the tiles we search through
        let volumeIds: number[] = [];
        //Pick an available tile index and do search for all connected tiles
        const searchOrigin = availableBlocks.pop();
        //list of indexes that are connected to the search origin
        const connectedTiles: number[] = [];
        //Add the search origin to the connectedTiles list so we can
        //pop it in the while loop below and start looking for connected tiles
        connectedTiles.push(searchOrigin);
        while (connectedTiles.length > 0) {
            const connectedTile = connectedTiles.pop();
            //If this tile has been visited previously skip it
            if (visitedTiles.includes(connectedTile)) {
                continue;
            }
            //Tile was not a impassable block or previously visited so lets add
            //it to the list of visited tiles
            visitedTiles.push(connectedTile);
            //add the volume id of this tile
            const volumeId = chunk.volumes[connectedTile];
            if (!volumeIds.includes(volumeId) && volumeId >= 0) {
                volumeIds.push(volumeId);
            }
            //Also remove the tile from available blocks unless the current block
            //is the searchorigin
            if (connectedTile !== searchOrigin) {
                removeFromArray(connectedTile, availableBlocks);
            }
            //and add any connected tiles to our
            //connectedTiles list so we can keep searching for its connected friends :)
            const leftIndex = getIndexLeft(connectedTile);
            const rightIndex = getIndexRight(connectedTile);
            const aboveIndex = getIndexAbove(connectedTile);
            const belowIndex = getIndexBelow(connectedTile);
            const validConnections = [];
            if (validateConnection(chunk, visitedTiles, leftIndex)) {
                validConnections.push(leftIndex);
                connectedTiles.push(leftIndex);
            }
            if (validateConnection(chunk, visitedTiles, rightIndex)) {
                validConnections.push(rightIndex);
                connectedTiles.push(rightIndex);
            }
            if (validateConnection(chunk, visitedTiles, aboveIndex)) {
                validConnections.push(aboveIndex);
                connectedTiles.push(aboveIndex);
            }
            if (validateConnection(chunk, visitedTiles, belowIndex)) {
                validConnections.push(belowIndex);
                connectedTiles.push(belowIndex);
            }
            if (connectedTiles.length > 0 && false) {
                console.log(
                    `Valid connections of ${connectedTile} was `,
                    validConnections
                );
            }
        }
        //We have now visited all the tiles connected to the search origin
        //set the volumeid of the tiles we have visited in the chunk to the same value
        volumes.push({
            visitedTiles,
            volumeIds
        });
        //For the future, check the current volume of tiles in this new volume.
        //If there are more than one type of room, we need to merge the two rooms.
        //The smaller room takes on the id of the larger room. This involves setting the roomid
        //of any volume with the smaller room id. and also adding the roomsize to the new
        //roomsize so that any future merges are handled based on the correct size
    }

    //Loop through all of the volumes and reserve its id
    //if another volume later comes along requesting the same volumeid we resolve
    //this conflict by giving the id to the largest volume and generating a new one
    //for the smallest volume. This is likely to happen when we place a wall that
    //splits and old volume into two new volumes
    //If a volume has multiple ids this means that we need to merge to previously
    //created volumes (e.g if a wall is removed opening up and area).
    //This is resolved by comparing the size of the old volumes and assigning the
    //id of the largest volume to the new volume that is a merge of the previous
    //volumes
    const idReservations: { [id: number]: number } = {};
    for (let v = 0; v < volumes.length; v++) {
        const volume = volumes[v];
        console.log("Volume: ", volume);
        if (volume.volumeIds.length > 1) {
            let largestVolume: { size: number; id: number } = null;
            for (const id of volume.volumeIds) {
                if (!!largestVolume && largestVolume.size > volumeSizes[id]) {
                    continue;
                }
                largestVolume = {
                    size: volumeSizes[id],
                    id
                };
            }
            idReservations[largestVolume.id] = v;
        } else if (volume.volumeIds.length === 1) {
            const volumeId = volume.volumeIds[0];
            if (idReservations[volumeId] !== undefined) {
                //The id has already been used!
                //This is happens if we have a volume that has been split into two
                //as the tiles both of the new volumes will point to the same old volume
                const indexOfVolumeHoldingReservation =
                    idReservations[volumeId];
                const volumeHoldingReservation =
                    volumes[indexOfVolumeHoldingReservation];

                const otherVolumeSize =
                    volumeHoldingReservation.visitedTiles.length;

                const thisVolumeSize = volume.visitedTiles.length;
                console.log(
                    `VolumeId ${volumeId} already reserved by: `,
                    volumeHoldingReservation
                );
                //Generate a new volume id that will be used by either this or the other
                const newVolumeId = incrementAndGetVolumeId();
                if (thisVolumeSize > otherVolumeSize) {
                    //Let this volume take the reservation and insert a new one
                    //with a generated id for the other
                    console.log(
                        `This volume was larger. Assigning a new volume id ${newVolumeId} to other`
                    );
                    idReservations[volumeId] = v;
                    idReservations[
                        newVolumeId
                    ] = indexOfVolumeHoldingReservation;
                } else {
                    console.log(
                        `Other volume was larger, assigning ${newVolumeId} to this`
                    );
                    idReservations[newVolumeId] = v;
                }
            } else {
                console.log(
                    `volumeId ${volumeId} was not reserved`,
                    idReservations
                );
                //Reserve this volumeid with the given volume index
                idReservations[volumeId] = v;
            }
        } else {
            //if a volume has no ids its likely because it was created from a
            //impasseable tile that is no longer impassable. Create a new id for it
            const newVolumeId = incrementAndGetVolumeId();
            idReservations[newVolumeId] = v;
        }
    }
    console.log("VolumeReservations: ", idReservations);
    //Loop over all the now conflict free volume ids and set them
    for (const volumeId in idReservations) {
        if (idReservations.hasOwnProperty(volumeId)) {
            const volumeIndex = idReservations[volumeId];
            const volume = volumes[volumeIndex];
            volume.visitedTiles.forEach((tileIndex) => {
                chunk.volumes[tileIndex] = Number.parseInt(volumeId);
            });
        }
    }
}

function incrementInMap(map: { [id: string]: number }, key: string) {
    let currentValue = map[key] || 0;
    map[key] = currentValue + 1;
}

function removeFromArray<T>(value: T, array: T[]) {
    const index = array.indexOf(value);
    if (index >= 0) {
        array.splice(index, 1);
    } else {
        console.error(
            "Could not remove from array as it did not exits",
            value,
            array
        );
    }
}

function validateConnection(
    chunk: Chunk,
    visitedTiles: number[],
    connectionIndex: number
): boolean {
    //Check that the connection index is within bounds
    //This is likely not be true if we are passed a index generated by
    //getIndex<above|below|left|right> as it will return -1 if there is
    //no tile in the related direction
    if (connectionIndex < 0 || connectionIndex > TOTALTILES - 1) {
        return false;
    }
    const blockType = chunk.blocks[connectionIndex];
    //If the block type is larger than 0 its not considered a connected tile
    //as it would be a wall or something impassable
    //This is likely to be update to a bit more smart based on context
    if (blockType > 0) {
        return false;
    }

    if (visitedTiles.includes(connectionIndex)) {
        return false;
    }

    return true;
}

function getIndexAbove(index: number): number {
    //getting the index of the tile above is as easy as subtracting
    //a row from the current index
    const tileY = Math.floor(index / NUMBEROFTILES);
    if (tileY > 0) {
        return index - NUMBEROFTILES;
    } else {
        return -1;
    }
}

function getIndexBelow(index: number): number {
    //Same with index below, add a row's worth of tiles to the index
    const tileY = Math.floor(index / NUMBEROFTILES);
    if (tileY < NUMBEROFTILESMINUSONE) {
        return index + NUMBEROFTILES;
    } else {
        return -1;
    }
}

function getIndexLeft(index: number): number {
    //Getting the index to the left is a bit more difficult as we cannot
    //subtract one, as this would faultly set the x7 y0 as the connected
    //tile of x0 y1

    //Do a check if the index is at the edge
    const tileX = index % NUMBEROFTILES;
    if (tileX > 0) {
        //Tile is at the edge, there is no connected tile
        return index - 1;
    } else {
        return -1;
    }
}

function getIndexRight(index: number): number {
    //Do a check if the index is at the edge
    const tileX = index % NUMBEROFTILES;
    if (tileX < NUMBEROFTILESMINUSONE) {
        //Tile is at the edge, there is no connected tile
        return index + 1;
    } else {
        return -1;
    }
}
