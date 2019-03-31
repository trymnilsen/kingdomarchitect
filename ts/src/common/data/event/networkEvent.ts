import { User } from "../user";

export const AuthenticateMessageId = "AUTH";
export const JoinChannelMessageId = "JOINCHANNEL";
export const LeaveChannelMessageId = "LEAVECHANNEL";
export const EventMessageId = "EVENTDATA";

export type NetworkEvent = AuthenticateMessageIdType | JoinChannelMessageIdType | LeaveChannelMessageIdType | EventMessageIdType;

export interface ChannelMessageIdData {
    channel: string;
    operation: "join" | "leave";
}
interface AuthenticateMessageIdType extends NetworkEventType<User> {
    id: typeof AuthenticateMessageId;
}
interface JoinChannelMessageIdType extends NetworkEventType<ChannelMessageIdData> {
    id: typeof JoinChannelMessageId;
}

interface LeaveChannelMessageIdType extends NetworkEventType<ChannelMessageIdData> {
    id: typeof LeaveChannelMessageId;
}

interface EventMessageIdType extends NetworkEventType<User> {
    id: typeof AuthenticateMessageId;
}

interface NetworkEventType<T> {
    id: string;
    data?: T;
    status?: "OK" | "REFUSE";
}

