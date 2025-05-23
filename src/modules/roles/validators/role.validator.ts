import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Role } from "../entities/role.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class RoleValidator extends ValidatorBase<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRoleDto): Promise<ValidationError[]> {
        if(await this.helper.exists(this.repo, 'roleName', dto.roleName)) { 
            this.addError({
              error: 'Role already exists.',
                status: 'EXIST',
                contextEntity: 'CreateRoleDto',
                value: dto.roleName,
            } as ValidationError);
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateRoleDto): Promise<ValidationError[]> {
        if(dto.roleName){
           if(await this.helper.exists(this.repo, 'roleName', dto.roleName)) { 
            this.addError({
              error: 'Role already exists.',
                status: 'EXIST',
                contextEntity: 'UpdateRoleDto',
                contextId: id,
                value: dto.roleName,
            } as ValidationError);
        }
        }
        return this.errors;
    }
}