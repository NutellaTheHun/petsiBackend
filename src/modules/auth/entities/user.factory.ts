import { hashPassword } from "../hash";
import { Role } from "./role.entities";
import { User } from "./user.entities";


export async function defaultUsers() : Promise<User[]> {
    const pHash = await hashPassword("test");
    // figure out nice way of getting roles.
    const roles = []
    return [
        createUserInstance("admin", "email@email.com", pHash, roles),
    ];
}

export function createUserInstance(
    username: string, email: string, hashedPassword: string, roles: Role[]) {
        const user = new User();
        user.username = username;
        user.email = email;
        user.passwordHash = hashedPassword //need to hash
        user.roles = roles;
        return user;
    }