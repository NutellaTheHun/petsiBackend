import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { Role } from "../entities/role.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class RoleValidator extends ValidatorBase<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'Role', requestContextService, logger); }

    public async validateCreate(dto: CreateRoleDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'roleName', dto.roleName)) {
            this.addError({
                errorMessage: 'Role already exists.',
                errorType: 'EXIST',
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
                    errorMessage: 'Role already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateRoleDto',
                    contextId: id,
                    value: dto.roleName,
                } as ValidationError);
            }
        }
        this.throwIfErrors()
    }
}