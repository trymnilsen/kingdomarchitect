import { EntityStore } from "./entityStore";
import { Entity } from "./entity";
import * as uuid from "uuid";

export const USER_ENTITY_NAME = "user";
export interface User extends Entity {

}
export class UserStore extends EntityStore<User> {
    public constructor() {
        super("user");
    }
    public async createAnonymousUser(): Promise<User> {
        const userData: User = {
            _id: uuid.v4(),
            _type: USER_ENTITY_NAME
        };
        const user = await this.insert(userData);
        return user;
    }
}
