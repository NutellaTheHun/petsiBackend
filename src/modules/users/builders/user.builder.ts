import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { User } from "../entities/user.entities";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { hashPassword } from "../../auth/utils/hash";
import { RoleService } from "../../roles/services/role.service";
import { UserValidator } from "../validators/user.validator";

@Injectable()
export class UserBuilder extends BuilderBase<User> {
    constructor(
        @Inject(forwardRef(() => RoleService))
        private readonly rolesService: RoleService,
        validator: UserValidator,
    ){ super(User, validator); }

    protected async createEntity(dto: CreateUserDto): Promise<void> {
        if(dto.email){
            this.email(dto.email);
        }
        if(dto.password){
            this.password( await hashPassword(dto.password) );
        }
        if(dto.roleIds){
            this.roles(dto.roleIds);
        }
        if(dto.username){
            this.username(dto.username);
        }
    }
    
    protected async updateEntity(dto: UpdateUserDto): Promise<void> {
        if(dto.email){
            this.email(dto.email);
        }
        if(dto.password){
            this.password( await hashPassword(dto.password) );
        }
        if(dto.roleIds){
            this.roles(dto.roleIds);
        }
        if(dto.username){
            this.username(dto.username);
        }
    }

    public username(name: string): this {
        return this.setProp('username', name);
    }

    public email(email: string): this {
        return this.setProp('email', email);
    }
    /**
     * - DOES NOT HASH PASSWORD
     * - Is Hashed in buildCreateDto() and buildUpdateDto();
     */
    public password(password: string): this {
        return this.setProp('password', password);
    }
    
    public roles(ids: number[]): this {
        return this.setPropsByIds(this.rolesService.findEntitiesById.bind(this.rolesService), 'roles', ids);
    }
}