import { Renderer } from "./rendering/renderer";
import { Input, InputEvent } from "../input/input";
import { rectangle } from "./rendering/items/rectangle";
import {
    Chunk,
    getWorldMap,
    TILESIZE,
    CHUNKSIZE,
    TOTALTILES,
    NUMBEROFTILES,
    Volume,
    NUMBEROFCHUNKS,
    incrementAndGetVolumeId,
    TOTALTILESMINUSONE,
    NUMBEROFTILESMINUSONE,
    WorldMap,
    getChunkId,
    getTileIndex,
    VolumeConnectionMap,
    incrementAndGetRoomId
} from "../state/state";
import { RenderNode, container } from "./rendering/items/renderNode";
import { Point, changeX, changeY } from "../data/point";
import { InputActionData } from "../input/inputAction";
import { rgbToHex } from "../util/color";
import { text } from "./rendering/items/text";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private world: WorldMap;
    private cameraPosition: Point = {
        x: 0,
        y: 0
    };
    public constructor(domElementWrapperSelector: string) {
        this.world = getWorldMap();
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
            this.cameraPosition = worldSpaceClickPoint;
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
        if (
            chunkX < 0 ||
            chunkX >= NUMBEROFCHUNKS ||
            chunkY < 0 ||
            chunkY >= NUMBEROFCHUNKS
        ) {
            console.log("Clicked outside of map");
            return;
        }
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
        const currentBlock = this.world.chunks[chunkId].blocks[tileIndex];
        if (currentBlock == 0) {
            this.world.chunks[chunkId].volumes[tileIndex] = -1;
            this.world.chunks[chunkId].blocks[tileIndex] = 1;
        } else {
            this.world.chunks[chunkId].blocks[tileIndex] = 0;
        }

        this.chunkUpdated(chunkId);
        this.update();
    }
    private update() {
        this.renderer.camera.center(this.cameraPosition);
        //this.renderer.camera.follow(this.cameraPosition);
        this.render();
    }

    private chunkUpdated(chunkId: number) {
        const startVolume = performance.now();
        const updateVolumesStart = performance.now();
        const newVolumes = updateVolumes(this.world, chunkId);
        for (let i = 0; i < newVolumes.newChunkVolumes.length; i++) {
            const volume = newVolumes.newChunkVolumes[i];
            this.world.volumes[volume.id] = volume;
        }
        newVolumes.volumesNoLongerExisting.forEach((id) => {
            delete this.world.volumes[id];
        });
        const updateVolumesEnd = performance.now();
        const updateVolumeConnectionsStart = performance.now();
        updateVolumeConnections(chunkId, this.world);
        const updateVolumeConnectionsEnd = performance.now();
        const updateRoomsStart = performance.now();
        updateRooms(chunkId, this.world);
        const updateRoomsEnd = performance.now();
        const endVolume = performance.now();
        console.log(`Update time used total ${endVolume - startVolume}`);
        console.log(
            `- Update Volumes time  ${updateVolumesEnd - updateVolumesStart}`
        );
        console.log(
            `- Update connections time ${updateVolumeConnectionsEnd -
                updateVolumeConnectionsStart}`
        );
        console.log(`- Update room time ${updateRoomsEnd - updateRoomsStart}`);
    }

    private render() {
        const getRenderNodesStart = performance.now();
        const nodes = getRenderNodesForChunks(this.world);
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

function getRenderNodesForChunks(world: WorldMap): RenderNode {
    const chunks = world.chunks;
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

            const volumeId = chunk.volumes[t];
            const volumeText = text({
                text: `V${volumeId}`,
                x: 8,
                y: 20,
                color: "black"
            });
            let room = "-1";
            if (volumeId >= 0) {
                const volume = world.volumes[volumeId];
                room = volume.room.toString();
            }
            const roomText = text({
                text: `R${room}`,
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

interface RoomSearchResult {
    roomIds: number[];
    visitedVolumes: Volume[];
}

function updateVolumeConnections(idOfChuckUpdated: number, world: WorldMap) {
    //Get the tiles on each edge
    //Loop over them and check if there is a volume defined for them
    //(no need to check if its valid.. That has already been done in updateVolumes,
    //if it has a volume assigned its valid)
    //if the tile has a volume get the neightbooring tile an check if it has a
    //volume defined. If it does then add a connection between the volume of
    //between the tile that is on the edge and the tile next to it
    const chunk = world.chunks[idOfChuckUpdated];
    const leftChunkId = getChunkId(chunk.x - 1, chunk.y);
    const rightChunkId = getChunkId(chunk.x + 1, chunk.y);
    const topChunkId = getChunkId(chunk.x, chunk.y - 1);
    const bottomChunkId = getChunkId(chunk.x, chunk.y + 1);
    //Clear all connections from this chunk and out
    chunk.connectedVolumes = {};
    const connectedVolumes: VolumeConnectionMap = {};

    //Check the left side
    if (leftChunkId >= 0) {
        const leftChunk = world.chunks[leftChunkId];
        checkChunkConnections(chunk, leftChunk, world);

        for (let y = 0; y < NUMBEROFTILES; y++) {
            const tileIndex = getTileIndex(0, y);
            const volumeId = chunk.volumes[tileIndex];
            //Get the tiles on the right side of the left chunk
            const otherTileIndex = getTileIndex(NUMBEROFTILESMINUSONE, y);
            addVolumeConnection(
                leftChunk,
                otherTileIndex,
                volumeId,
                connectedVolumes
            );
        }
    }

    //Check the right side
    if (rightChunkId >= 0) {
        const rightChunk = world.chunks[rightChunkId];
        checkChunkConnections(chunk, rightChunk, world);

        for (let y = 0; y < NUMBEROFTILES; y++) {
            const tileIndex = getTileIndex(NUMBEROFTILESMINUSONE, y);
            const volumeId = chunk.volumes[tileIndex];
            //Get the tiles on the left side of the right chunk
            const otherTileIndex = getTileIndex(0, y);
            addVolumeConnection(
                rightChunk,
                otherTileIndex,
                volumeId,
                connectedVolumes
            );
        }
    }

    //Check the top side
    if (topChunkId >= 0) {
        const topChunk = world.chunks[topChunkId];
        checkChunkConnections(chunk, topChunk, world);

        for (let x = 0; x < NUMBEROFTILES; x++) {
            const tileIndex = getTileIndex(x, 0);
            const volumeId = chunk.volumes[tileIndex];
            //Get the tiles on the bottom side side of the chunk above
            const otherTileIndex = getTileIndex(x, NUMBEROFTILESMINUSONE);
            addVolumeConnection(
                topChunk,
                otherTileIndex,
                volumeId,
                connectedVolumes
            );
        }
    }

    //Check the bottom side
    if (bottomChunkId >= 0) {
        const bottomChunk = world.chunks[bottomChunkId];
        checkChunkConnections(chunk, bottomChunk, world);

        for (let x = 0; x < NUMBEROFTILES; x++) {
            const tileIndex = getTileIndex(x, NUMBEROFTILESMINUSONE);
            const volumeId = chunk.volumes[tileIndex];
            //Get the tiles on the bottom side side of the chunk above
            const otherTileIndex = getTileIndex(x, 0);
            addVolumeConnection(
                bottomChunk,
                otherTileIndex,
                volumeId,
                connectedVolumes
            );
        }
    }
    chunk.connectedVolumes = connectedVolumes;
}

function addVolumeConnection(
    otherChunk: Chunk,
    otherTileIndex: number,
    volumeId: number,
    connectedVolumes: { [from: number]: number[] }
) {
    const otherTileVolume = otherChunk.volumes[otherTileIndex];
    //If this from volume is not less than 0 aka invalid
    //and the tile on the "other side" is a valid volume as well
    //add a connection
    if (volumeId >= 0 && otherTileVolume >= 0) {
        //There is a connection, yay!
        pushIfNotIncludes(
            otherTileVolume,
            getMapArray(connectedVolumes, volumeId)
        );
        pushIfNotIncludes(
            volumeId,
            getMapArray(otherChunk.connectedVolumes, otherTileVolume)
        );
    }
}

function getMapArray(map: { [id: number]: number[] }, key: number): number[] {
    if (map[key] === undefined) {
        map[key] = [];
    }
    return map[key];
}

function pushIfNotIncludes<T>(value: T, array: T[]) {
    if (!array.includes(value)) {
        array.push(value);
    }
}

//Cleanup/Sanity check: Check that the connections from the the connected chunk
//refer to a valid volume. It might not if it refers to a volume
//that was deleted when the updated chunk was updated and got
//some of its volumes merged.
function checkChunkConnections(aChunk: Chunk, bChunk: Chunk, world: WorldMap) {
    //Remove any connections that point from chunk B to chunk A as these
    //might nolonger be valid if chunk A is updated (but the volume still exists)
    //Its just not connected to the volume anymore (e.g putting a wall)
    //along the edge.
    for (const fromVolume in bChunk.connectedVolumes) {
        if (bChunk.connectedVolumes.hasOwnProperty(fromVolume)) {
            //Get the volume id the other side of the connection is pointing to
            removeDeadConnection(
                fromVolume,
                bChunk.connectedVolumes[fromVolume]
            );
            //The connected volume might have been removed in the function above
            //Do a check if it still exists
            if (bChunk.connectedVolumes[fromVolume] !== undefined) {
                removeConnectionsFromBChunkToAChunk(
                    fromVolume,
                    bChunk.connectedVolumes[fromVolume]
                );
            }
        } else {
            console.log("fasle");
        }
    }

    function removeConnectionsFromBChunkToAChunk(
        fromVolume: string,
        toVolumeIds: number[]
    ) {
        //Filter out any connections pointing to volumes in chunk a
        const connectionsNotToChunkA = toVolumeIds.filter((connection) => {
            if (aChunk.volumes.includes(connection)) {
                console.log(
                    `connection from volume ${fromVolume} to volume ${connection} terminated in chunk A, Filtering it out`,
                    aChunk.volumes
                );
                return false;
            } else {
                return true;
            }
        });

        bChunk.connectedVolumes[fromVolume] = connectionsNotToChunkA;
    }

    function removeDeadConnection(fromVolume: string, toVolumeIds: number[]) {
        //Filter out any connected volume ids that no longer exists
        const validVolumeIds = toVolumeIds.filter((volumeId) => {
            return world.volumes[volumeId] !== undefined;
        });
        //if the result are an emtpy array (meaning all the ids no longer
        //existed) we delete the entire entry. Otherwise we set the filtered
        //list of ids as the new list of connected ids
        if (validVolumeIds.length > 0) {
            bChunk.connectedVolumes[fromVolume] = validVolumeIds;
        } else {
            delete bChunk.connectedVolumes[fromVolume];
        }
    }
}

function updateRooms(idOfChunkUpdated: number, world: WorldMap) {
    const volumeOrigins: Volume[] = [];
    const uniqueVolumes = {};
    for (let v = 0; v < world.chunks[idOfChunkUpdated].volumes.length; v++) {
        const volumeId = world.chunks[idOfChunkUpdated].volumes[v];
        if (uniqueVolumes[volumeId] === undefined && volumeId >= 0) {
            volumeOrigins.push(world.volumes[volumeId]);
            uniqueVolumes[volumeId] = volumeId;
        }
    }

    const rooms: RoomSearchResult[] = [];

    while (volumeOrigins.length > 0) {
        const visitedVolumes: { [id: string]: Volume } = {};
        const searchOrigin = volumeOrigins.pop();
        const connectedVolumes: Volume[] = [searchOrigin];
        const roomIds: number[] = [];
        while (connectedVolumes.length > 0) {
            const connectedVolume = connectedVolumes.pop();
            if (!!visitedVolumes[connectedVolume.id]) {
                continue;
            }

            visitedVolumes[connectedVolume.id] = connectedVolume;
            if (!!connectedVolume.room) {
                pushIfNotIncludes(connectedVolume.room, roomIds);
            }
            //If we come across any of other volumeorigins makes sure to remove
            //them from the array, unless its the one we started our search at
            //because it would not be present in the list as it has been poped
            //of wehn starting the search
            if (
                connectedVolume.id !== searchOrigin.id &&
                volumeOrigins.some((item) => item.id == connectedVolume.id)
            ) {
                removeFromArray(connectedVolume, volumeOrigins);
            }

            //Get all volumes that are connected to this volume and add them
            //to connected volumes
            //1. We need the chunk the volume is in to get the map of volume
            //connections
            const chunkIdVolumeIsIn = connectedVolume.chunk;
            const chunkVolumeIsIn = world.chunks[chunkIdVolumeIsIn];
            const connections =
                chunkVolumeIsIn.connectedVolumes[connectedVolume.id];
            if (!!connections) {
                console.log(
                    `Volume ${connectedVolume.id} was connected to`,
                    connections
                );
                //Loop through all of the connection ids and add them to the list of connections
                connections.forEach((item) => {
                    const volume = world.volumes[item];
                    connectedVolumes.push(volume);
                });
            }
        }
        const visitedVolumesAsArray = Object.values(visitedVolumes);
        if (visitedVolumesAsArray.length > 0) {
            rooms.push({
                roomIds: roomIds,
                visitedVolumes: visitedVolumesAsArray
            });
        } else {
            console.error(
                "Uhh, we should not really get here if unless there is some corruption"
            );
        }
    }
    const roomsNoLongerExisting: number[] = [];
    //A map of requested room id, and the room search result holding on to the id
    const roomReservations: { [id: number]: number } = {};
    for (let r = 0; r < rooms.length; r++) {
        const room = rooms[r];
        if (room.roomIds.length > 1) {
            //More than one room was found in the same group of volumes
            let largestRoom: { size: number; id: number } = null;
            for (const id of room.roomIds) {
                if (!!largestRoom && largestRoom.size > world.rooms[id].size) {
                    roomsNoLongerExisting.push(id);
                    continue;
                }
                largestRoom = {
                    size: world.rooms[id].size,
                    id
                };
            }
            roomReservations[largestRoom.id] = r;
        } else if (room.roomIds.length === 1) {
            const roomId = room.roomIds[0];
            if (roomReservations[roomId] !== undefined) {
                //The id has already been used!

                //This is happens if we have a volume that has been split into two
                //as the tiles both of the new volumes will point to the same old volume
                const indexOfRoomHoldingReservation = roomReservations[roomId];
                const roomHoldingReservation =
                    rooms[indexOfRoomHoldingReservation];

                const otherRoomSize = roomHoldingReservation.visitedVolumes.reduce(
                    (accumulator, volume) => {
                        return accumulator + volume.size;
                    },
                    0
                );
                const thisRoomSize = room.visitedVolumes.reduce(
                    (accumulator, volume) => {
                        return accumulator + volume.size;
                    },
                    0
                );
                console.log(
                    `RoomId ${roomId} already reserved by: `,
                    roomHoldingReservation
                );
                const newRoomId = incrementAndGetRoomId();
                if (thisRoomSize > otherRoomSize) {
                    //Let this room take the reservation and insert a new one
                    //with a generated id for the other
                    console.log(
                        `This room was larger ${thisRoomSize}. Assigning a new room id ${newRoomId} to other with size ${otherRoomSize}`
                    );
                    roomReservations[roomId] = r;
                    roomReservations[newRoomId] = indexOfRoomHoldingReservation;
                } else {
                    console.log(
                        `Other room was larger ${otherRoomSize}, assigning ${newRoomId} to this with size ${thisRoomSize}`
                    );
                    roomReservations[newRoomId] = r;
                }
            } else {
                console.log(
                    `Room ${roomId} was not reserved, reserving it for`,
                    room
                );
                roomReservations[roomId] = r;
            }
        } else {
            const newRoomId = incrementAndGetRoomId();
            console.log(
                `Room had no id, assigning a new one ${newRoomId}`,
                room
            );
            roomReservations[newRoomId] = r;
        }
    }

    console.log("Room reservations: ", roomReservations);
    //Loop over the reserve rooms and update them in the room
    for (const roomId in roomReservations) {
        if (roomReservations.hasOwnProperty(roomId)) {
            const room = rooms[roomReservations[roomId]];
            const newRoom = {
                chunks: room.visitedVolumes.map((item) => item.chunk),
                size: room.visitedVolumes.reduce(
                    (accumulator, volume) => accumulator + volume.size,
                    0
                ),
                volumes: room.visitedVolumes.map((item) => item.id)
            };
            console.log(`Setting new room ${roomId}`, newRoom);
            world.rooms[roomId] = newRoom;
            //update the room of the volumes
            newRoom.volumes.forEach((volumeId) => {
                world.volumes[volumeId].room = Number.parseInt(roomId);
            });
        }
    }
    //Delete any no longer existing rooms
    roomsNoLongerExisting.forEach((item) => {
        delete world.rooms[item];
    });
}

interface UpdateVolumeResult {
    volumesNoLongerExisting: number[];
    newChunkVolumes: Volume[];
}

function updateVolumes(world: WorldMap, chunkId: number): UpdateVolumeResult {
    //Add the indexes of all tiles in the chunk that are not completely blocked
    const availableBlocks: number[] = [];
    const chunk = world.chunks[chunkId];
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
            volume.volumeIds = [largestVolume.id];
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
                    volume.volumeIds = [volumeId];
                    volumeHoldingReservation.volumeIds = [newVolumeId];
                } else {
                    console.log(
                        `Other volume was larger, assigning ${newVolumeId} to this`
                    );
                    idReservations[newVolumeId] = v;
                    volume.volumeIds = [newVolumeId];
                    volumeHoldingReservation.volumeIds = [volumeId];
                }
            } else {
                console.log(
                    `volumeId ${volumeId} was not reserved`,
                    idReservations
                );
                //Reserve this volumeid with the given volume index
                //no need to update the searchresult itself as it has only one correct
                //volume id entry
                idReservations[volumeId] = v;
            }
        } else {
            //if a volume has no ids its likely because it was created from a
            //impasseable tile that is no longer impassable. Create a new id for it
            const newVolumeId = incrementAndGetVolumeId();
            idReservations[newVolumeId] = v;
            volume.volumeIds = [newVolumeId];
        }
    }
    const finalVolumes: Volume[] = [];
    console.log("VolumeReservations: ", idReservations);
    //Loop over all the now conflict free volume ids and set them
    for (const volumeId in idReservations) {
        if (idReservations.hasOwnProperty(volumeId)) {
            //Set the volume
            const volumeIndex = idReservations[volumeId];
            const volume = volumes[volumeIndex];
            const volumeIdAsNumber = Number.parseInt(volumeId);
            volume.visitedTiles.forEach((tileIndex) => {
                chunk.volumes[tileIndex] = volumeIdAsNumber;
            });

            const existingVolume = world.volumes[volumeId];
            const roomId = !!existingVolume ? existingVolume.room : null;
            //Create a final volume
            finalVolumes.push({
                room: roomId,
                chunk: chunkId,
                id: volumeIdAsNumber,
                size: volume.visitedTiles.length
            });
        }
    }
    //Get all volumes that are currently defined, but not in the new list
    //I.e volumes that do not exist anymore. Use the volume sizes object to
    //enumerate the different volumes
    const nonExistingIds = Object.keys(volumeSizes)
        .filter((item) => {
            return item !== "-1" && idReservations[item] === undefined;
        })
        .map((item) => Number.parseInt(item));
    return {
        newChunkVolumes: finalVolumes,
        volumesNoLongerExisting: nonExistingIds
    };
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
