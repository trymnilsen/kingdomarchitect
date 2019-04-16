import { Action } from "../action";
import { User } from "../../data/user";

export type PlayerJoinedAction = Action<User>;
export const PlayerJoinedActionId = "addToUserGameAction";
