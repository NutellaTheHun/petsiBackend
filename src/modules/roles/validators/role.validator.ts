import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role, RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleValidator extends ValidatorBase<RoleEntity> {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Role', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRoleDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (await this.helper.exists(this.repo, 'roleName', dto.roleName)) {
      const err = new ValidationErrorNode(
        'roleName',
        undefined,
        'Role with this name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRoleDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.roleName) {
      if (await this.helper.exists(this.repo, 'roleName', dto.roleName)) {
        const err = new ValidationErrorNode(
          'roleName',
          undefined,
          'Role with this name already exists.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
