import { Repository } from 'typeorm';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { ValidatorHelper } from '../validation/validatator-helper';
import {
    ValidationErrorMap,
    ValidationErrorResponse,
} from '../validation/validation-error';
import { EntityBase } from './entity.base';
import { ValidatorIdentityBaseInterface } from './validator-identity.base.interface';

export abstract class ValidatorBase<
    T extends EntityBase<any, any, any>,
    I extends ValidatorIdentityBaseInterface,
> {
    protected helper: ValidatorHelper<T['__Entity'], I>;

    constructor(
        private readonly entityRepo: Repository<T['__Entity']>,
        private readonly validationPrefix: string,
        protected readonly requestContextService: RequestContextService,
    ) {
        this.helper = new ValidatorHelper<T['__Entity'], I>();
    }

    public async validateDto(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<ValidationErrorResponse | null> {
        const result = await this.validate(dto, id);
        return result ? this.getValidateResponse(result) : null;
    }

    /**
     * Same as `validateDto`, but returns the error map itself (with log-only context)
     * so `ServiceBase` can hand it to `ValidationException`. Null when there are no errors.
     */
    public async validate(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<ValidationErrorMap | null> {
        const resolvedIdentity = await this.resolveIdentity(dto, id);

        const result = await this.validateIdentity(resolvedIdentity, id);
        return result.isEmpty() ? null : result;
    }

    protected abstract validateIdentity(
        identity: I,
        id?: number | string,
    ): Promise<ValidationErrorMap>;

    public async validateNestedIdentity(
        field: string,
        nestedIdentity: I,
        rootErrorMap: ValidationErrorMap /*id: number | string*/,
    ): Promise<void> {
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
