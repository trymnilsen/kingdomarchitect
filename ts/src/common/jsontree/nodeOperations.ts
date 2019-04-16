import { JsonNode } from "./jsonNode";

export enum OperationMode {
    update,
    sync
}
export interface NodeOperation {
    mode: OperationMode;
}

export function applyOperations(ops: NodeOperation[], node: JsonNode): void {}

//A operation can either be update or sync todo: find new names?
//a update.. update is usually a server pushing that something happened and
//the client can decide that the date it is holding is newer or better
//example a user moving the character will get the move event sent back to them
//this can be ignore as the player probably has moved already
//however if the player is more nefarious and sent an event that is not allowed
//such as moving into a tile that is taken.. The client might allow it as we cant
//really control it. Therefore a sync is sent saying this is the new authoritive data
//of course the client can ignore it, but then you just end up with a client that is out of sync
//and not working as it should
