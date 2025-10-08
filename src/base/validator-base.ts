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
   */
  protected abstract doValidateCreateNode(
    dto: T['__CDto'],
  ): Promise<ValidationErrorNode[] | null>;

  /**
   * Entity implementation of buisness logic validation
   * @param result
   * @param dto
   */
  protected abstract doValidateUpdateNode(
    dto: T['__UDto'],
  ): Promise<ValidationErrorNode[] | null>;

  /**
   * root level validation function of DTOs, is still called within other root level validation calls.
   * @param field
   * @param dto
   * @returns
   */
  public async validateCreateNode(
    field: string,
    dto: T['__CDto'],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    const valErrs = await this.doValidateCreateNode(dto);
    if (valErrs && valErrs.length > 0) {
      result.addChildren(valErrs);
    }

    return result.isEmpty() ? null : result;
  }

  public async validateManyCreateNode(
    field: string,
    dtos: T['__CDto'][],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    for (const dto of dtos) {
      const valErrs = await this.doValidateCreateNode(dto);
      if (valErrs) {
        result.addChildren(valErrs);
      }
    }

    return result.isEmpty() ? null : result;
  }

  /**
   * root level validation function of DTOs, is still called within other root level validation calls.
   * @param field
   * @param dto
   * @returns
   */
  public async validateUpdateNode(
    field: string,
    dto: T['__UDto'],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    const valErrs = await this.doValidateUpdateNode(dto);
    if (valErrs) {
      result.addChild(valErrs);
    }

    return result.isEmpty() ? null : result;
  }

  public async validateManyUpdateNode(
    field: string,
    dtos: T['__UDto'][],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    for (const dto of dtos) {
      const valErrs = await this.doValidateUpdateNode(dto);
      if (valErrs) {
        result.addChild(valErrs);
      }
    }

    return result.isEmpty() ? null : result;
  }

  /**
   * Wrapper function to parse nested DTOs.
   * @param field
   * @param dto
   * @returns
   */
  public async validateNestedNode(
    field: string,
    dto: T['__NDto'],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    if (dto?.createId && dto.createDto) {
      const valErrs = await this.doValidateCreateNode(dto);
      if (valErrs) {
        result.addChild(valErrs);
      }
    } else if (dto?.id && dto.updateDto) {
      const child = await this.doValidateUpdateNode(dto);
      if (child) {
        result.addChild(child);
      }
    } else {
      throw new error('validate nested node has neither create id or id.');
    }

    return result.isEmpty() ? null : result;
  }

  public async validateManyNestedNode(
    field: string,
    dtos: T['__NDto'][],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);
    for (const dto of dtos) {
      if (dto?.createId && dto.createDto) {
        const child = await this.doValidateCreateNode(dto);
        if (child) {
          result.addChild(child);
        }
      } else if (dto?.id && dto.updateDto) {
        const child = await this.doValidateUpdateNode(dto);
        if (child) {
          result.addChild(child);
        }
      } else {
        throw new error('validate nested node has neither create id or id.');
      }
    }
    return result.isEmpty() ? null : result;
  }
}
