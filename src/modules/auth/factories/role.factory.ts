import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { CreateRoleDto } from "../dto/create-role.dto";
import { plainToInstance } from "class-transformer";
import { UpdateRoleDto } from "../dto/update-role.dto";

export class RoleFactory {
    constructor() { }

    createDtoToEntity(roleDto: CreateRoleDto): Role{
        const role = plainToInstance(Role, { ...roleDto });
        return role;
    }

    updateDtoToEntity(roleDto: UpdateRoleDto): Role {
        const role = plainToInstance(Role, { ...roleDto });
        return role;
    }
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
