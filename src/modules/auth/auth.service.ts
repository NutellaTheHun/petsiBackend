import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { DataSource, Repository } from 'typeorm';
import { Role } from './entities/role.entities';
import { CrudRepoService } from 'src/Base/CRUDRepoService';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class AuthService {
    readonly users: CrudRepoService<User, CreateUserDto, UpdateUserDto>;
    readonly roles: CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>;

    constructor(
        @InjectRepository(User)
        private usersRepo: Repository<User>,

        @InjectRepository(Role)
        private rolesRepo: Repository<Role>,    
    ){
        this.users = new CrudRepoService(this.usersRepo, CreateUserDto, UpdateUserDto);
        this.roles = new CrudRepoService(this.rolesRepo, CreateRoleDto, UpdateRoleDto);
    }
}
