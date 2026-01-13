import { error } from 'console';
import { Repository } from 'typeorm';
import { AppLogger } from '../../modules/app-logging/app-logger';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { ValidatorHelper } from '../validation/validatator-helper';
import { ValidationErrorNode } from '../validation/validation-error';
import { ValidationExceptionHandler } from '../validation/validation-exception.handler';
import { EntityBase } from './entity.base';
import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';

export abstract class ValidatorBase<
  T extends EntityBase<any, any, any, any, any>,
> {
  protected helper: ValidatorHelper<T['__Entity'], T['__CDto'] | T['__UDto']>;
  private exceptionHandler: ValidationExceptionHandler;

  constructor(
    private readonly entityRepo: Repository<T['__Entity']>,
    private readonly validationPrefix: string,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {
    this.exceptionHandler = new ValidationExceptionHandler(logger);
    this.helper = new ValidatorHelper<
      T['__Entity'],
      T['__CDto'] | T['__UDto']
    >();
  }

  /**
   * Entity implementation of buisness logic validation. If the resulting array is empty, returns null.
   * @param result
   * @param dto
   */
  protected abstract doValidateCreateNode(
    dto: T['__CDto'],
    id?: string,
  ): Promise<ValidationErrorNode[] | null>;

  /**
   * Entity implementation of buisness logic validation
   * @param result
   * @param dto
   */
  protected abstract doValidateUpdateNode(
    dto: T['__UDto'],
    id: number,
  ): Promise<ValidationErrorNode[] | null>;

  /**
   * If the resulting array has elements, it is returned, otherwise returns null
   * @param result
   * @returns
   */
  protected checkValidateResult(
    result: ValidationErrorNode[],
  ): ValidationErrorNode[] | null {
    if (result.length > 0) {
      return result;
    }
    return null;
  }

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
    id: number,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    const valErrs = await this.doValidateUpdateNode(dto, id);
    if (valErrs) {
      result.addChildren(valErrs);
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
    dto: unknown,
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(field);

    if (this.isNestedCreateDto(dto)) {
      const valErrs = await this.doValidateCreateNode(dto, dto.createId);
      if (valErrs) {
        result.addChildren(valErrs);
      }
    } else if (this.isNestedUpdateDto(dto)) {
      const child = await this.doValidateUpdateNode(dto, dto.id);
      if (child) {
        result.addChildren(child);
      }
    } else {
      throw new error('validateNestedNode received invalid nested DTO');
    }

    return result.isEmpty() ? null : result;
  }

  public async validateManyNestedNode(
    field: string,
    dtos: unknown[],
  ): Promise<ValidationErrorNode | null> {
    const result = new ValidationErrorNode(String(field));

    for (const dto of dtos) {
      if (this.isNestedCreateDto(dto)) {
        const child = await this.doValidateCreateNode(dto, dto.createId);
        if (child) {
          result.addChildren(child);
        }
      } else if (this.isNestedUpdateDto(dto)) {
        const child = await this.doValidateUpdateNode(dto, dto.id);
        if (child) {
          result.addChildren(child);
        }
      } else {
        throw new error('validateNestedNode received invalid nested DTO');
      }
    }

    return result.isEmpty() ? null : result;
  }

  private isNestedCreateDto(dto: unknown): dto is NestedCreateDto {
    return (
      typeof dto === 'object' &&
      dto !== null &&
      'createId' in dto &&
      typeof (dto as any).createId === 'string'
    );
  }

  private isNestedUpdateDto(dto: unknown): dto is NestedUpdateDto {
    return (
      typeof dto === 'object' &&
      dto !== null &&
      'id' in dto &&
      typeof (dto as any).id === 'number'
    );
  }
}
