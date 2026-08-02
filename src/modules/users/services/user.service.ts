import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { TenantScopedServiceBase } from '../../../common/base/tenant-scoped-service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { hashPassword } from '../../auth/utils/hash';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserEntity } from '../entities/user.entities';
import { UserChangeDetector } from '../utils/change-detectors/user.change-detector';
import { UserValidator } from '../validators/user.validator';

@Injectable()
export class UserService extends TenantScopedServiceBase<UserEntity> {
    constructor(
        @InjectRepository(User)
        userRepo: Repository<User>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: UserValidator,
        private readonly userChangeDetector: UserChangeDetector,
    ) {
        super(userRepo, 'UserService', requestContextService, logger, validator);
    }

    protected async createEntity(
        dto: CreateUserDto,
        manager: EntityManager,
    ): Promise<User> {
        const password = await hashPassword(dto.password);

        const result = manager.create(User, {
            tenantId: this.getTenantId(),
            name: dto.name,
            email: dto.email,
            isTenantAdmin: dto.isTenantAdmin ?? false,
            password,
        });
        await manager.save(result);

        return {
            id: result.id,
            tenantId: result.tenantId,
            name: result.name,
            email: result.email,
            isTenantAdmin: result.isTenantAdmin,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        } as User;
    }

    protected async updateEntity(
        dto: UpdateUserDto,
        manager: EntityManager,
        entity: User,
    ): Promise<void> {
        if (dto.email !== undefined) {
            entity.email = dto.email;
        }

        if (dto.password !== undefined) {
            entity.password = await hashPassword(dto.password);
        }

        if (dto.isTenantAdmin !== undefined) {
            entity.isTenantAdmin = dto.isTenantAdmin;
        }

        if (dto.name !== undefined) {
            entity.name = dto.name;
        }

        await manager.save(entity);
    }

    protected applySearch(query: SelectQueryBuilder<User>, search: string): void {
        query.andWhere('(LOWER(entity.name) LIKE :search)', {
            search: `%${search.toLowerCase()}%`,
        });
    }

    protected applySortBy(
        query: SelectQueryBuilder<User>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<User, UpdateUserDto> | undefined {
        return this.userChangeDetector;
    }
}
