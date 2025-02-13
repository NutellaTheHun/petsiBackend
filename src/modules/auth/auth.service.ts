import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entities';
import { CrudRepoService } from 'src/Base/CRUDRepoService';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hashPassword, isPassHashMatch } from './hash';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { createUserInstance } from './entities/user.factory';

@Injectable()
export class AuthService {
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

        if (await isPassHashMatch(pass, user.passwordHash)){
            throw new UnauthorizedException();
        }

        const payload = { sub: user.id, username: user.username}
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async createUser(username: string, password: string, email:string, roles: Role[]): Promise<void>{
        const alreadyExists = await this.users.findOne({ where: { username: username,},});
        if(alreadyExists){
            // needs more refined error
            throw new ExceptionsHandler();
        }

        const pHash = await hashPassword(password);
        const user = createUserInstance(username, pHash, email, roles);
        this.usersRepo.create(user);
    }

    getJwtSecret(): string | undefined { return this.configSerivce.get<string>('JWT_SECRET');}
}
