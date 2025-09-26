import { ObjectLiteral, Repository } from 'typeorm';
import { AppLogger } from '../modules/app-logging/app-logger';
import { RequestContextService } from '../modules/request-context/RequestContextService';
import {
  ValidationError,
  ValidationErrorNode,
} from '../util/exceptions/validation-error';
import { ValidationExceptionHandler } from '../util/exceptions/validation-exception.handler';
import { ValidatorHelper } from '../util/validatator-helper.util';

export abstract class ValidatorBase<T extends ObjectLiteral> {
  protected errors: ValidationErrorNode;
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

  //public abstract validateCreate(createId: string, dto: any): Promise<void>;
  //public abstract validateUpdate(id: number, dto: any): Promise<void>;

  public abstract validateCreateNode(
    field: string,
    dto?: any,
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null>;

  public abstract validateUpdateNode(
    field: string,
    dto?: any,
    id?: string | number,
    message?: string,
  ): Promise<ValidationErrorNode | null>;

  protected buildValidationError<K extends keyof T>(
    field: K,
    message: string,
    errorType: string,
    id?: number,
    createId?: string,
  ) {
    return new ValidationError({
      field: field as string,
      message,
      errorType,
      id,
      createId,
    });
  }

  /*private reset() {
    this.errors = [];
  }*/
}
