import { EntityStore } from "./entityStore";
import { Entity } from "./entity";

export interface User extends Entity {

}
export class UserStore extends EntityStore<User> {
    public constructor() {
        super("user");
    }
    public createUser() {
        
    }
}
