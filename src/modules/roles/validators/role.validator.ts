import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { Role } from "../entities/role.entity";

@Injectable()
export class RoleValidator extends ValidatorBase<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
    ) { super(repo); }

    public async validateCreate(dto: CreateRoleDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'roleName', dto.roleName)) {
            this.addError({
                error: 'Role already exists.',
                status: 'EXIST',
                contextEntity: 'CreateRoleDto',
                value: dto.roleName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateRoleDto): Promise<void> {
        if (dto.roleName) {
            if (await this.helper.exists(this.repo, 'roleName', dto.roleName)) {
                this.addError({
                    error: 'Role already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateRoleDto',
                    contextId: id,
                    value: dto.roleName,
                } as ValidationError);
            }
        }
        this.throwIfErrors()
    }
}