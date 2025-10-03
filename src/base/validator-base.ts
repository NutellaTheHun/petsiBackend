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
    private readonly entityRepo: Repository<T['__Entity']>,
    private readonly validationPrefix: string,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {
    this.exceptionHandler = new ValidationExceptionHandler(logger);
  }

  /**
   * Entity implementation of buisness logic validation
   * @param result
   * @param dto
   * @param id
   * @param message
   */
  protected abstract doValidateCreateNode(
    result: ValidationErrorNode,
    dto: T['__CDto'],
    id?: string | number,
    message?: string,
  ): Promise<void>;

  /**
   * Entity implementation of buisness logic validation
   * @param result
   * @param dto
   * @param id
   * @param message
   */
  protected abstract doValidateUpdateNode(
    result: ValidationErrorNode,
    dto: T['__UDto'],
    id?: string | number,
    message?: string,
  ): Promise<void>;

  /**
   * root level validation function of DTOs, is still called within other root level validation calls.
   * @param field
   * @param dto
   * @param id
   * @param message
   * @returns
   */
  public async validateCreateNode(
    field: string,
    dto: T['__CDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field, id);
    await this.doValidateCreateNode(result, dto, id, message);
    return result.isEmpty() ? null : result;
  }

  /**
   * root level validation function of DTOs, is still called within other root level validation calls.
   * @param field
   * @param dto
   * @param id
   * @param message
   * @returns
   */
  public async validateUpdateNode(
    field: string,
    dto: T['__UDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field, id);
    await this.doValidateUpdateNode(result, dto, id, message);
    return result.isEmpty() ? null : result;
  }

  /**
   * Wrapper function to parse nested DTOs.
   * @param field
   * @param dto
   * @param id
   * @param message
   * @returns
   */
  public async validateNestedNode(
    field: string,
    dto: T['__NDto'],
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null> {
    if (dto?.createId && dto.createDto) {
      return this.validateCreateNode(field, dto.createDto, id, message);
    } else if (dto?.id && dto.updateDto) {
      return this.validateUpdateNode(field, dto.updateDto, id, message);
    }
    throw new error('validate nested node has neither create id or id.');
  }
}
