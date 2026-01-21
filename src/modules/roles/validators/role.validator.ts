import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Role with this name already exists.',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateRoleDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Role with this name already exists.',
      );
    }

    return errorMap;
  }
}
