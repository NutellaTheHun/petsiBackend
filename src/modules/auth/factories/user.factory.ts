import { CreateUserDto } from "../dto/create-user.dto";
import { hashPassword } from "../utils/hash";
import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { plainToInstance } from "class-transformer";
import { In, Repository } from "typeorm";
import { UpdateUserDto } from "../dto/update-user.dto";

export class UserFactory{
    constructor(private rolesService: Repository<Role>){}

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
        await createUserInstance("admin", pHash, "email@email.com", roles),
    ];
}

export async function createUserInstance(username: string, rawPassword: string, email: string, roles: Role[] | null): Promise<User> {
        const user = new User();
        user.username = username;
        user.email = email;
        user.passwordHash = await hashPassword(rawPassword);
        user.roles = []
        if(roles){
            user.roles = roles;
        }
        return user;
}

