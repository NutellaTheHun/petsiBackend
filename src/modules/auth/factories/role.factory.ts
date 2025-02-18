import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { CreateRoleDto } from "../dto/create-role.dto";
import { plainToInstance } from "class-transformer";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RoleFactory {
    constructor() { }

    createDtoToEntity(roleDto: CreateRoleDto): Role{
        return plainToInstance(Role, { ...roleDto });
    }

    updateDtoToEntity(roleDto: UpdateRoleDto): Role {
        return plainToInstance(Role, { ...roleDto });
    }

    entityToCreateDto(role: Role): CreateRoleDto {
        return plainToInstance(CreateRoleDto, { ...role });
    }

    getDefaultRoles(): Role[] {
        return [
            this.createRoleInstance("admin", []),
            this.createRoleInstance("manager", []),
            this.createRoleInstance("staff", [])
        ];
    }

    getTestingRoles(): Role[]{
        return this.getDefaultRoles();
    }

    createRoleInstance(name:string, users: User[]): Role {
        const role = new Role();
        role.name = name;
        role.users = users;
        return role;
    }
}
