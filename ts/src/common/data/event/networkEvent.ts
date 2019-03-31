export interface NetworkEvent {
    id: string;
    data: any;
    status?: "OK" | "REFUSE";
}

export const AuthenticateMessageId = "AUTH";
