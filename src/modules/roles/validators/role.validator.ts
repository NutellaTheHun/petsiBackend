import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role, RoleEntity } from '../entities/role.entity';
import { RoleValidatorIdentity } from './identities/role.validator.identity.interface';

@Injectable()
export class RoleValidator extends ValidatorBase<RoleEntity, RoleValidatorIdentity> {

    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Role', requestContextService, logger);
    }

    protected async validateIdentity(identity: RoleValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRoleDto | UpdateRoleDto, id: number | string): Promise<RoleValidatorIdentity> {
        return {
            name: dto.name,
        } as RoleValidatorIdentity;
    }
}
