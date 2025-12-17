import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { hashPassword } from '../../auth/utils/hash';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { UserBuilder } from '../builders/user.builder';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserEntity } from '../entities/user.entities';
import { UserValidator } from '../validators/user.validator';

@Injectable()
export class UserService extends ServiceBase<UserEntity> {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    userBuilder: UserBuilder,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: UserValidator,
  ) {
    super(
      userRepo,
      userBuilder,
      'UserService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateUserDto,
    manager: EntityManager,
  ): Promise<User> {
    const password = await hashPassword(dto.password);
    const roles = dto.roleIds ? dto.roleIds.map((i) => ({ id: i })) : [];

    const result = manager.create(User, {
      username: dto.name,
      email: dto.email,
      roles,
      password,
    });
    return result;
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

    if (dto.roleIds !== undefined) {
      entity.roles = dto.roleIds.map((i) => manager.create(Role, { id: i }));
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
  }

  /*
  async create(createUserDto: CreateUserDto) {
    const user = (await super.create(createUserDto)) as User;
    user.password = '';
    return user;
  }
    */

  async findOneByName(
    username: string,
    relations?: Array<keyof User>,
  ): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { name: username },
      relations: relations,
    });
  }

  protected applySearch(query: SelectQueryBuilder<User>, search: string): void {
    query.andWhere('(LOWER(entity.username) LIKE :search)', {
      search: `%${search.toLowerCase()}%`,
    });
  }

  protected applyFilters(
    query: SelectQueryBuilder<User>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.role && filters.role.length > 0) {
      query
        .leftJoin('entity.roles', 'role')
        .andWhere('role.id IN (:...roles)', { roles: filters.role });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<User>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'username') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
