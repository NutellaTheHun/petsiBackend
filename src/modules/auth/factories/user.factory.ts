import { CreateUserDto } from "../dto/create-user.dto";
import { hashPassword } from "../utils/hash";
import { Role } from "../entities/role.entities";
import { User } from "../entities/user.entities";
import { plainToInstance } from "class-transformer";
import { In, Repository } from "typeorm";
import { UpdateUserDto } from "../dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserFactory{
    
    constructor(
        @InjectRepository(Role)
        private rolesRepo: Repository<Role>,
    ){}

    async createDtoToEntity(userDto: CreateUserDto) : Promise<User>{
        const pHash = await hashPassword(userDto.rawPassword)
        const roles = await this.rolesRepo.find({ where: { id: In(userDto.roleIds) }});

        return plainToInstance(User, {
            username: userDto.username,
            email: userDto.email,
            passwordHash: pHash, 
            roles: roles
        });
    }

    async updateDtoToEntity(userDto: UpdateUserDto) : Promise<User> {
        const roles = userDto.roleIds?.length
            ? await this.rolesRepo.find({ where: { id: In(userDto.roleIds) }})
            : [];
   
            return plainToInstance(User, {
                username: userDto.username,
                email: userDto.email,
                roles: roles
            });
    }

    /** Atleast use for testing purposes, needs to pass raw password 
     * to properly hash at the correct time. 
     * */
    entityToCreateDto(user: User, rawPassword: string): CreateUserDto {
        return plainToInstance(CreateUserDto, { 
            ...user, 
            rawPassword, 
            roleIds: user.roles.map(role => role.id) 
        });
    }

    async defaultUsers() : Promise<User[]> {
        const pHash = await hashPassword("test");
        // figure out nice way of getting roles.
        const roles = []
        return [
            await this.createUserInstance("admin", pHash, "email@email.com", roles),
        ];
    }
    
    async getTestUsers() : Promise<User[]> {
        return await this.defaultUsers();
    }
    
    async createUserInstance(username: string, rawPassword: string, email: string, roles: Role[] | null): Promise<User> {
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
}



