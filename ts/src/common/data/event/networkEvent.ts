import { User } from "../user";
import { GameEvent } from "./gameEvent";

export const AuthenticateMessageId = "AUTH";
export const JoinChannelMessageId = "JOINCHANNEL";
export const LeaveChannelMessageId = "LEAVECHANNEL";
export const ChannelMessageId = "CHANNELMESSAGE";

export type NetworkEvent =
    | AuthenticateMessageIdType
    | JoinChannelMessageIdType
    | LeaveChannelMessageIdType
    | ChannelMessage;

export interface ChannelMessageIdData {
    channel: string;
    operation: "join" | "leave";
}
export interface AuthenticateMessageIdType extends NetworkEventType<User> {
    id: typeof AuthenticateMessageId;
}
export interface JoinChannelMessageIdType
    extends NetworkEventType<ChannelMessageIdData> {
    id: typeof JoinChannelMessageId;
}

export interface LeaveChannelMessageIdType
    extends NetworkEventType<ChannelMessageIdData> {
    id: typeof LeaveChannelMessageId;
}

export interface ChannelMessage extends NetworkEventType<ChannelMessageData> {
    id: typeof ChannelMessageId;
}

export interface ChannelMessageData {
    channel: string;
    data: GameEvent;
}
interface NetworkEventType<T> {
    id: string;
    recipient?: string;
    data?: T;
    status?: "OK" | "REFUSE";
}
