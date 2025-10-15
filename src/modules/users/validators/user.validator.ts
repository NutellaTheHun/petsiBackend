import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // username exists
    if (await this.helper.exists(this.repo, 'username', dto.username)) {
      const err = new ValidationErrorNode(
        'username',
        undefined,
        'username name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateUserDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.username) {
      const err = new ValidationErrorNode(
        'username',
        undefined,
        'username name already exists.',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
