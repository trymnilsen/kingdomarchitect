import { getUser, User, setUser } from "./data/user";

export async function authenticate() {
    // Check local storage for user
    const currentUser = getUser();
    if (!currentUser) {
        try {
            const response = await fetch("http://localhost:5000/user/anonymous", {
                method: "POST"
            });
            const responseData = await response.json();
            setUser({
                id: responseData._id
            });
        } catch (err) {
            console.error(err);
        }
    }
}
