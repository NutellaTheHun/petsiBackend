import { CreateUserDto } from "../dto/create-user.dto";
import { hashPassword } from "../hash";
import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { CrudRepoService } from "src/Base/CRUDRepoService";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { plainToInstance } from "class-transformer";
import { In } from "typeorm";
import { UpdateUserDto } from "../dto/update-user.dto";

export class UserFactory{
    constructor(private rolesService: CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>){}

    async createDtoToEntity(userDto: CreateUserDto) : Promise<User>{
        const pHash = hashPassword(userDto.password)
        const roles = await this.rolesService.find({ where: { id: In(userDto.roleIds) }});

        return plainToInstance(User, {...userDto, passwordHash: pHash, roles});
    }

    async updateDtoToEntity(userDto: UpdateUserDto) : Promise<User> {
        const roles = userDto.roleIds?.length
            ? await this.rolesService.find({ where: { id: In(userDto.roleIds) }})
            : [];
   
            return plainToInstance(User, {...userDto, roles});
    }
}

export async function defaultUsers() : Promise<User[]> {
    const pHash = await hashPassword("test");
    // figure out nice way of getting roles.
    const roles = []
    return [
        createUserInstance("admin", pHash, "email@email.com", roles),
    ];
}

export function createUserInstance(username: string, hashedPassword: string, email: string, roles: Role[] | null) {
        const user = new User();
        user.username = username;
        user.email = email;
        user.passwordHash = hashedPassword //need to hash
        user.roles = []
        if(roles){
            user.roles = roles;
        }
        return user;
}

