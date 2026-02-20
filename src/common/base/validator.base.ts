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
import { ValidatorIdentityBaseInterface } from './validator-identity.base.interface';

export abstract class ValidatorBase<
    T extends EntityBase<any, any, any>,
    I extends ValidatorIdentityBaseInterface,
> {
    protected helper: ValidatorHelper<T['__Entity'], T['__CDto'] | T['__UDto'], I>;
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
            T['__CDto'] | T['__UDto'],
            I
        >();
    }

    public async validateDto(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<ValidationErrorResponse | null> {
        const resolvedIdentity = await this.resolveIdentity(dto, id);

        const result = await this.validateIdentity(resolvedIdentity, id);
        return this.getValidateResponse(result);
    }

    protected abstract validateIdentity(
        identity: I,
        id?: number | string,
    ): Promise<ValidationErrorMap>;

    public async validateNestedIdentity(field: string, nestedIdentity: I, rootErrorMap: ValidationErrorMap, /*id: number | string*/): Promise<void> {
        const id = nestedIdentity.id ?? nestedIdentity.createId;
        if (!id) {
            throw new Error('Nested identity id is required');
        }
        const valErrs = await this.validateIdentity(nestedIdentity, id);
        if (!valErrs.isEmpty()) {
            rootErrorMap.addChild(field, valErrs);
        }
    }

    public abstract resolveIdentity(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<I>;

    protected getValidateResponse(
        result: ValidationErrorMap,
    ): ValidationErrorResponse | null {
        if (result.isEmpty()) {
            return null;
        }
        return result.buildResponse();
    }
}
