import { AuthService } from "../auth.service";
import { Role } from "./role.entities";
import { User } from "./user.entities";

export class RoleFactory {
    constructor( private authService: AuthService) { }

    
}

export function getDefaultRoles(): Role[] {
    return [
        createRoleInstance("admin", []),
        createRoleInstance("manager", []),
        createRoleInstance("staff", [])
    ];
}

export function createRoleInstance(name:string, users: User[]): Role {
    const role = new Role();
    role.name = name;
    role.users = users;
    return role;
}
