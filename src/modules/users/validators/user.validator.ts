import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserEntity } from '../entities/user.entities';

@Injectable()
export class UserValidator extends ValidatorBase<UserEntity> {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'User', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateUserDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // username exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'username name already exists.',
    );

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateUserDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'username name already exists.',
      );
    }

    return errorMap;
  }
}
