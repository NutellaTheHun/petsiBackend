import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location, LocationEntity } from '../entities/location.entity';
import { LocationValidatorIdentity } from './identities/location.validator.identity.interface';

@Injectable()
export class LocationValidator extends ValidatorBase<LocationEntity, LocationValidatorIdentity> {

    constructor(
        @InjectRepository(Location)
        private readonly repo: Repository<Location>,

        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Location', requestContextService, logger);
    }

    protected async validateIdentity(identity: LocationValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.tenantId !== undefined) {
            await this.helper.enforceExists(
                identity.tenantId,
                this.tenantRepo,
                'tenant',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateLocationDto | UpdateLocationDto, id: number | string): Promise<LocationValidatorIdentity> {
        return {
            tenantId: dto.tenantId,
            name: dto.name,
            address: dto.address,
            phoneNumber: dto.phoneNumber,
            email: dto.email,
        } as LocationValidatorIdentity;
    }
}
