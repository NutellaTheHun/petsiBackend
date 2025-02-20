import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { In, QueryBuilder, QueryFailedError, Repository } from 'typeorm';
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
import { CrudRepoService } from '../../base/crud-repo-service';import { CrudRepository } from '../../base/crud-repository';
``

@Injectable()
export class AuthService {
    //readonly users: CrudRepoService<User, CreateUserDto, UpdateUserDto>;
    //readonly roles: CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>;
    readonly userFactory: UserFactory;
    readonly roleFactory: RoleFactory;
    //readonly usersRepo: CrudRepository<User>;
    //readonly rolesRepo: CrudRepository<Role>;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,    
        
        //@InjectRepository(Role)
        //private readonly roleRepo: CrudRepository<Role>,

        //@InjectRepository(User)
        //private readonly userRepo: CrudRepository<User>,

        private jwtService: JwtService,
        private configSerivce: ConfigService,
    ){ 
        //this.users = new CrudRepoService<User, CreateUserDto, UpdateUserDto>(this.usersRepo, CreateUserDto, UpdateUserDto);
        //this.roles = new CrudRepoService<Role, CreateRoleDto, UpdateRoleDto>(this.rolesRepo, CreateRoleDto, UpdateRoleDto);
        this.userFactory = new UserFactory(this);
        this.roleFactory = new RoleFactory(this);
    }

    async signIn(username: string, pass: string): Promise<{ access_token: string }> {
        //const user = await this.users.findOne({ where: { username: username,},});
        const user = await this.userRepo.findOne({ where: { username: username } });
        if(!user){
            throw new UnauthorizedException('Invalid username or password');// check if this wil suffice
        }
        if (!(await isPassHashMatch(pass, user.passwordHash))){
            throw new UnauthorizedException('Invalid username or password');
        }
        const payload = { sub: user.id, username: user.username}
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    getJwtSecret(): string | undefined { 
        return this.configSerivce.get<string>('JWT_SECRET');
    }

    async createUser(userDto: CreateUserDto): Promise<User | null | QueryFailedError>{
        //const alreadyExists = await this.users.findOne({ where: { username: userDto.username,},});
        const alreadyExists = await this.userRepo.findOne({ where: { username: userDto.username,},});
        if(alreadyExists){
            return null;
        }

        const roleIds = userDto.roleIds || []
        const user = await this.userFactory.createEntityInstance(userDto, { roles: this.getRolesById(roleIds)});
        return this.userRepo.create(user);
    }

    /**
     * Id currently not used, using Repository.save for lifecycle hooks
     * @param id currently not used, using Repository.save for lifecycle hooks
     * @param userDto 
     * @returns 
     */
    async updateUser(id: number, userDto: UpdateUserDto): Promise<User | null | QueryFailedError> {
        const alreadyExists = await this.userRepo.findOne({ where: { username: userDto.username,},});
        if(!alreadyExists){
            return null;
        }

        const roleIds = userDto.roleIds || []
        const user = await this.userFactory.updateEntityInstance(userDto, { roles: this.getRolesById(roleIds) });
        return this.userRepo.save(user);
    }

    
    async deleteUser(id: number): Promise<Boolean> {
        return (await this.userRepo.delete(id)).affected !== 0;
    }
    

    async getUser(id: number): Promise<User | null> {
        return await this.userRepo.findOne({ where: {id} });
    }

    //Need to handle querying (Temporary)
    async getAllUsers(): Promise<User[]> {
        return await this.userRepo.find();
    }

    async getUsersById( userIds: number[]): Promise<User[]>{
        return await this.userRepo.find({ where: { id: In(userIds) }});
    }

    async createRole(roleDto: CreateRoleDto): Promise<Role | null | QueryFailedError> {
        const alreadyExists = await this.roleRepo.findOne({ where: { name: roleDto.name}});
        if(alreadyExists){
            return null;
        }
        const userIds = roleDto.userIds || [];
        const role = await this.roleFactory.createEntityInstance(roleDto, { users: this.getUsersById(userIds)});
        return this.roleRepo.create(role);
    }

    /**
     * Id currently not used, using Repository.save for lifecycle hooks
     * @param id currently not used, using Repository.save for lifecycle hooks
     * @param roleDto 
     * @returns 
     */
    async updateRole(id: number, roleDto: UpdateRoleDto): Promise<Role | QueryFailedError> {
        const alreadyExists = await this.roleRepo.findOne({ where: { name: roleDto.name}});
        if(!alreadyExists){
            throw new ExceptionsHandler(); //more detailed error
        }
        const userIds = roleDto.userIds || []
        const role = await this.roleFactory.updateEntityInstance(roleDto, { users: this.getUsersById(userIds)});
        return this.roleRepo.save(role);
    }

    async deleteRole(id: number): Promise<Boolean> {
        return (await this.roleRepo.delete(id)).affected !== 0; 
    }
    
    async getRole(id: number): Promise<Role | null> {
        return await this.roleRepo.findOne({where: {id} });
    }

    //Need to handle querying (Temporary)
    async getAllRoles(): Promise<Role[]> {
        return await this.roleRepo.find();
    }

    async getRolesById( roleIds: number[]): Promise<Role[]> {
        return await this.roleRepo.find({ where: { id: In(roleIds) }});
    }

    createRoleQueryBuilder(): QueryBuilder<Role> {
        return this.roleRepo.createQueryBuilder();
    }

    createUserQueryBuilder(): QueryBuilder<User> {
        return this.userRepo.createQueryBuilder();
    }
}