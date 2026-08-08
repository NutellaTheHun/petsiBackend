import { Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { hashPassword } from '../../auth/utils/hash';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entities';

@Injectable()
export class UserBuilder extends BuilderBase<User> {
  constructor(requestContextService: RequestContextService, logger: AppLogger) {
    super(User, 'UserBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateUserDto): void {
    if (dto.email !== undefined) {
      this.email(dto.email);
    }
    if (dto.password !== undefined) {
      this.password(dto.password);
    }
    if (dto.isTenantAdmin !== undefined) {
      this.isTenantAdmin(dto.isTenantAdmin);
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
    if (dto.isTenantAdmin !== undefined) {
      this.isTenantAdmin(dto.isTenantAdmin);
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

  public isTenantAdmin(isTenantAdmin: boolean): this {
    return this.setPropByVal('isTenantAdmin', isTenantAdmin);
  }

  public tenantId(tenantId: number): this {
    return this.setPropByVal('tenantId', tenantId);
  }
}
