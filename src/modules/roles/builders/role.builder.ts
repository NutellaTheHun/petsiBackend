import { forwardRef, Inject } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { UserService } from "../../users/services/user.service";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { Role } from "../entities/role.entity";
import { RoleValidator } from "../validators/role.validator";

export class RoleBuilder extends BuilderBase<Role>{
    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,

        validator: RoleValidator,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(Role, 'RoleBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateRoleDto): void {
        if(dto.roleName !== undefined){
            this.roleName(dto.roleName);
        }
    }

    protected updateEntity(dto: UpdateRoleDto): void {
        if(dto.roleName !== undefined){
            this.roleName(dto.roleName);
        }
    }

    public roleName(name: string): this {
        return this.setPropByVal('roleName', name);
    }
}