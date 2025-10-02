import { error } from 'console';
import { Repository } from 'typeorm';
import { AppLogger } from '../modules/app-logging/app-logger';
import { RequestContextService } from '../modules/request-context/RequestContextService';
import { ValidationErrorNode } from '../util/exceptions/validation-error';
import { ValidationExceptionHandler } from '../util/exceptions/validation-exception.handler';
import { ValidatorHelper } from '../util/validatator-helper.util';
import { EntityBase } from './entity-base';

export abstract class ValidatorBase<T extends EntityBase<any, any, any, any>> {
  protected helper = new ValidatorHelper();
  private exceptionHandler: ValidationExceptionHandler;

  constructor(
    private readonly entityRepo: Repository<T>,
    private readonly validationPrefix: string,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {
    this.exceptionHandler = new ValidationExceptionHandler(logger);
  }

  protected abstract doValidateCreateNode(
    result: ValidationErrorNode,
    dto: T['createDto'],
    id?: string | number,
    message?: string,
  ): Promise<void>;

  protected abstract doValidateUpdateNode(
    result: ValidationErrorNode,
    dto: T['updateDto'],
    id?: string | number,
    message?: string,
  ): Promise<void>;

  public async validateCreateNode(
    field: string,
    dto: T['createDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field, id);
    await this.doValidateCreateNode(result, dto, id, message);
    return result.isEmpty() ? null : result;
  }

  public async validateUpdateNode(
    field: string,
    dto: T['updateDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field, id);
    await this.doValidateUpdateNode(result, dto, id, message);
    return result.isEmpty() ? null : result;
  }

  public async validateNestedNode(
    field: string,
    dto?: T['nestedDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    if (dto?.createId) {
      return this.validateCreateNode(field, dto, id, message);
    } else if (dto?.id) {
      return this.validateUpdateNode(field, dto, id, message);
    }
    throw new error('validate nested node has neither create id or id.');
  }
}
