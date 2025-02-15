import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { isPassHashMatch } from './utils/hash';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { UserFactory } from './factories/user.factory';
import { RoleFactory } from './factories/role.factory';
import { CrudRepoService } from '../../base/crud-repo-service';

@Injectable()
export class AuthService {
    readonly userFactory: UserFactory;
    readonly roleFactory: RoleFactory;
    readonly users: CrudRepoService<User, CreateUserDto, UpdateUserDto>;
    readonly roles: CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>;

    constructor(
        @InjectRepository(User)
        private usersRepo: Repository<User>,

        @InjectRepository(Role)
        private rolesRepo: Repository<Role>,    

        private jwtService: JwtService,
        private configSerivce: ConfigService,
    ){ 
        this.users = new CrudRepoService<User, CreateUserDto, UpdateUserDto>(this.usersRepo, CreateUserDto, UpdateUserDto);
        this.roles = new CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>(this.rolesRepo, CreateRoleDto, UpdateRoleDto);
    }

    async signIn(username: string, pass: string): Promise<{ access_token: string }> {
        const user = await this.users.findOne({ where: { username: username,},});
        if(!user){
            throw new UnauthorizedException();
        }
        if (await !isPassHashMatch(pass, user.passwordHash)){
            throw new UnauthorizedException();
        }
        const payload = { sub: user.id, username: user.username}
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    getJwtSecret(): string | undefined { 
        return this.configSerivce.get<string>('JWT_SECRET');
    }

    async createUser(userDto: CreateUserDto): Promise<void>{
        const alreadyExists = await this.users.findOne({ where: { username: userDto.username,},});
        if(alreadyExists){
            throw new ExceptionsHandler();// needs more refined error
        }
        const user = await this.userFactory.createDtoToEntity(userDto);
        this.users.create(user);
    }

    async updateUser(id: number, userDto: UpdateUserDto) {
        const alreadyExists = await this.users.findOne({ where: { username: userDto.username,},});
        if(!alreadyExists){
            throw new ExceptionsHandler();// needs more refined error
        }
        const user = await this.userFactory.updateDtoToEntity(userDto);
        this.users.update(id, user);
    }

    async createRole(roleDto: CreateRoleDto): Promise<void> {
        const alreadyExists = await this.roles.findOne({ where: { name: roleDto.name}});
        if(alreadyExists){
            throw new ExceptionsHandler();
        }
        const role = await this.roleFactory.createDtoToEntity(roleDto);
        this.roles.create(role);
    }

    async updateRole(id: number, roleDto: UpdateRoleDto) {
        const alreadyExists = await this.roles.findOne({ where: { name: roleDto.name}});
        if(!alreadyExists){
            throw new ExceptionsHandler();
        }
        const role = await this.roleFactory.updateDtoToEntity(roleDto);
        this.roles.update(id, role);
    }
}