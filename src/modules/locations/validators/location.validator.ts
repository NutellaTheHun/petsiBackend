import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location, LocationEntity } from '../entities/location.entity';
import { LocationValidatorIdentity } from './identities/location.validator.identity.interface';

@Injectable()
export class LocationValidator extends ValidatorBase<LocationEntity, LocationValidatorIdentity> {

    constructor(
        @InjectRepository(Location)
        private readonly repo: Repository<Location>,

        requestContextService: RequestContextService,
    ) {
        super(repo, 'Location', requestContextService);
    }

    protected async validateIdentity(identity: LocationValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        // No business rules yet; tenant comes from the request context.
        return new ValidationErrorMap(id);
    }

    public async resolveIdentity(dto: CreateLocationDto | UpdateLocationDto, id: number | string): Promise<LocationValidatorIdentity> {
        return {
            name: dto.name,
            address: dto.address,
            phoneNumber: dto.phoneNumber,
            email: dto.email,
        } as LocationValidatorIdentity;
    }
}
