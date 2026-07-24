import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant, TenantEntity } from '../entities/tenant.entity';
import { TenantValidatorIdentity } from './identities/tenant.validator.identity.interface';

@Injectable()
export class TenantValidator extends ValidatorBase<TenantEntity, TenantValidatorIdentity> {

    constructor(
        @InjectRepository(Tenant)
        private readonly repo: Repository<Tenant>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Tenant', requestContextService, logger);
    }

    protected async validateIdentity(identity: TenantValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.subdomain) {
            await this.helper.enforceUnique(
                identity.subdomain,
                this.repo,
                'subdomain',
                errorMap,
                id,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateTenantDto | UpdateTenantDto, id: number | string): Promise<TenantValidatorIdentity> {
        return {
            name: dto.name,
            subdomain: dto.subdomain,
        } as TenantValidatorIdentity;
    }
}
