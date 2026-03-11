import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserEntity } from '../entities/user.entities';
import { UserValidatorIdentity } from './identities/user.valdiator.identity.interface';

@Injectable()
export class UserValidator extends ValidatorBase<UserEntity, UserValidatorIdentity> {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'User', requestContextService, logger);
    }
    protected async validateIdentity(identity: UserValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.email) {
            await this.helper.enforceUnique(
                identity.email,
                this.repo,
                'email',
                errorMap,
                id,
            );
        }

        if (identity.password) {
            // password requirements?
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

    public async resolveIdentity(dto: CreateUserDto | UpdateUserDto, id: number | string): Promise<UserValidatorIdentity> {
        return {
            email: dto.email,
            password: dto.password,
            roleIds: dto.roleIds,
            name: dto.name,
        } as UserValidatorIdentity;
    }
}
