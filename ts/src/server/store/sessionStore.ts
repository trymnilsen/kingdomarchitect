import { EntityStore } from "./entityStore";
import { Entity } from "./entity";

export interface Session extends Entity {}
export class SessionStore extends EntityStore<Session> {}
