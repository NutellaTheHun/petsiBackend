import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { hashPassword } from '../../auth/utils/hash';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';

@Injectable()
export class UserBuilder extends BuilderBase<User> {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(User, 'UserBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateUserDto): void {
    if (dto.email !== undefined) {
      this.email(dto.email);
    }
    if (dto.password !== undefined) {
      this.password(dto.password);
    }
    if (dto.roleIds !== undefined) {
      this.roles(dto.roleIds);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  protected updateEntity(dto: UpdateUserDto): void {
    if (dto.email !== undefined) {
      this.email(dto.email);
    }
    if (dto.password !== undefined) {
      this.password(dto.password);
    }
    if (dto.roleIds !== undefined) {
      this.roles(dto.roleIds);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public email(email: string | null): this {
    if (email === null) {
      return this.setPropByVal('email', null);
    }
    return this.setPropByVal('email', email);
  }
  /**
   * - DOES NOT HASH PASSWORD
   * - Is Hashed in buildCreateDto() and buildUpdateDto();
   */
  public password(password: string): this {
    return this.setPropByFn(hashPassword, 'password', password);
  }

  public roles(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.rolesRepo.find({ where: { id: In(ids) } }),
      'roles',
      ids,
    );
  }
}
