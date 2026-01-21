import { Repository } from 'typeorm';
import { AppLogger } from '../../modules/app-logging/app-logger';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { ValidatorHelper } from '../validation/validatator-helper';
import {
  ValidationErrorMap,
  ValidationErrorResponse,
} from '../validation/validation-error';
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
   * Entity implementation of buisness logic validation.
   * @param result
   * @param dto
   */
  protected abstract doValidateCreateNode(
    dto: T['__CDto'],
    id?: string,
  ): Promise<ValidationErrorMap>;

  /**
   * Entity implementation of buisness logic validation
   * @param result
   * @param dto
   */
  protected abstract doValidateUpdateNode(
    dto: T['__UDto'],
    id: number,
  ): Promise<ValidationErrorMap>;

  /**
   * If the resulting error map is not empty, returns the result as a ValidationErrorResponse, otherwise returns null
   * @param result error map to validate
   */
  protected validateResult(
    result: ValidationErrorMap,
  ): ValidationErrorResponse | null {
    if (result.isEmpty()) {
      return null;
    }
    return result.getResult();
  }

  /**
   * root level validation function of DTOs, only called by service.base.create.
   * @param dto root DTO to validate
   * @returns ValidationErrorResponse if validation errors are found, otherwise null
   */
  public async validateCreateNode(
    dto: T['__CDto'],
  ): Promise<ValidationErrorResponse | null> {
    const result = await this.doValidateCreateNode(dto);
    return this.validateResult(result);
  }

  public async validateManyCreateNode(
    field: string,
    dtos: T['__CDto'][],
  ): Promise<ValidationErrorMap | null> {
    const result = new ValidationErrorMap(undefined, field);

    for (const dto of dtos) {
      const valErrs = await this.doValidateCreateNode(dto);
      if (valErrs) {
        result.addChild(field, valErrs);
      }
    }

    return result.isEmpty() ? null : result;
  }

  /**
   * root level validation function of DTOs, only called by service.base.update.
   * @param field
   * @param dto
   * @returns
   */
  public async validateUpdateNode(
    dto: T['__UDto'],
    id: number,
  ): Promise<ValidationErrorResponse | null> {
    const result = await this.doValidateUpdateNode(dto, id);

    return this.validateResult(result);
  }

  /**
   * Wrapper function to parse nested DTOs. Adds validation errors to the given rootErrorMap under the given field.
   * @param field property corresponding to nested DTO
   * @param dto nested DTO to validate
   * @param rootErrorMap error map that validation errors will be added to under the given field
   */
  public async validateNestedNode(
    field: string,
    dto: unknown,
    rootErrorMap: ValidationErrorMap,
  ): Promise<void> {
    if (this.isNestedCreateDto(dto)) {
      const valErrs = await this.doValidateCreateNode(dto, dto.createId);
      if (!valErrs.isEmpty()) {
        rootErrorMap.addChild(field, valErrs);
      }
    } else if (this.isNestedUpdateDto(dto)) {
      const valErrs = await this.doValidateUpdateNode(dto, dto.id);
      if (!valErrs.isEmpty()) {
        rootErrorMap.addChild(field, valErrs);
      }
    } else {
      throw new Error('validateNestedNode received invalid nested DTO');
    }
  }

  /**
   * Wrapper function to parse multiple nested DTOs. Adds validation errors to the given rootErrorMap under the given field.
   * @param field property corresponding to nested DTO
   * @param dtos array of nested DTOs to validate
   * @param rootErrorMap error map that validation errors will be added to under the given field
   */
  public async validateManyNestedNode(
    field: string,
    dtos: unknown[],
    rootErrorMap: ValidationErrorMap,
  ): Promise<void> {
    for (const dto of dtos) {
      if (this.isNestedCreateDto(dto)) {
        const valErrs = await this.doValidateCreateNode(dto, dto.createId);
        if (!valErrs.isEmpty()) {
          rootErrorMap.addChild(field, valErrs);
        }
      } else if (this.isNestedUpdateDto(dto)) {
        const valErrs = await this.doValidateUpdateNode(dto, dto.id);
        if (!valErrs.isEmpty()) {
          rootErrorMap.addChild(field, valErrs);
        }
      } else {
        throw new Error('validateNestedNode received invalid nested DTO');
      }
    }
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
