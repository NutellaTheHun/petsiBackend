import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entities';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';
import { UserLocation, UserLocationEntity } from '../entities/user-location.entity';
import { UserLocationValidatorIdentity } from './identities/user-location.validator.identity.interface';

@Injectable()
export class UserLocationValidator extends ValidatorBase<UserLocationEntity, UserLocationValidatorIdentity> {
    constructor(
        @InjectRepository(UserLocation)
        private readonly repo: Repository<UserLocation>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'UserLocation', requestContextService, logger);
    }

    protected async validateIdentity(identity: UserLocationValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.userId !== undefined) {
            await this.helper.enforceExists(
                identity.userId,
                this.userRepo,
                'user',
                errorMap,
            );
        }

        if (identity.roleIds) {
            for (const roleId of identity.roleIds) {
                await this.helper.enforceExists(
                    roleId,
                    this.roleRepo,
                    'roles',
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateUserLocationDto | UpdateUserLocationDto, id: number | string): Promise<UserLocationValidatorIdentity> {
        return {
            userId: (dto as CreateUserLocationDto).userId,
            locationId: dto.locationId,
            roleIds: dto.roleIds,
        } as UserLocationValidatorIdentity;
    }
}
