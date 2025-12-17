import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RoleBuilder } from '../builders/role.builder';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role, RoleEntity } from '../entities/role.entity';
import { RoleValidator } from '../validators/role.validator';

@Injectable()
export class RoleService extends ServiceBase<RoleEntity> {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,

    @Inject(forwardRef(() => RoleBuilder))
    builder: RoleBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RoleValidator,
  ) {
    super(
      repo,
      builder,
      'RoleService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateRoleDto,
    manager: EntityManager,
  ): Promise<Role> {
    const result = manager.create(Role, {
      roleName: dto.name,
    });
    return result;
  }

  protected async updateEntity(
    dto: UpdateRoleDto,
    manager: EntityManager,
    entity: Role,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
  }

  async findOneByName(
    roleName: string,
    relations?: Array<keyof Role>,
  ): Promise<Role | null> {
    return await this.repo.findOne({
      where: { name: roleName },
      relations: relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<Role>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'roleName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
