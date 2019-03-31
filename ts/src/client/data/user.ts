import { User } from "../../common/data/user";

const userKey = "USERDATA";

export function getUser(): User {
    const userData = window.localStorage.getItem(userKey);
    if (!!userData) {
        try {
            return JSON.parse(userData);
        } catch (err) {
            console.error(err);
        }
    }

    return null;
}

export function setUser(user: User) {
    window.localStorage.setItem(userKey, JSON.stringify(user));
}
