import { forwardRef, Inject } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { Role } from "../entities/role.entities";
import { UserService } from "../../users/services/user.service";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";

export class RoleBuilder extends BuilderBase<Role>{
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ){ super(Role); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public users(ids: number[]): this {
        return this.setPropsByIds(this.userService.findEntitiesById.bind(this.userService), 'users', ids);
    }

    public async buildCreateDto(dto: CreateRoleDto): Promise<Role> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.userIds){
            this.users(dto.userIds);
        }

        return this.build();
    }

    public async buildUpdateDto(toUpdate: Role, dto: UpdateRoleDto): Promise<Role> {
        this.reset()
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.userIds){
            this.users(dto.userIds);
        }

        return this.build();
    }
}