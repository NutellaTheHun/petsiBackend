import { forwardRef, Inject } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { Role } from "../entities/role.entity";
import { UserService } from "../../users/services/user.service";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { RoleValidator } from "../validators/role.validator";

export class RoleBuilder extends BuilderBase<Role>{
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        validator: RoleValidator,
    ){ super(Role, validator); }

    protected async createEntity(dto: CreateRoleDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateRoleDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.userIds){
            this.users(dto.userIds);
        };
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public users(ids: number[]): this {
        return this.setPropsByIds(this.userService.findEntitiesById.bind(this.userService), 'users', ids);
    }
}