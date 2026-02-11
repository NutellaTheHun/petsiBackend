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

    /** NEW STRATEGY, NOT DONE YET */
    public async validateDto(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<ValidationErrorResponse | null> {
        const resolvedIdentity = await this.resolveIdentity(dto, id);

        const result = await this.validateIdentity(resolvedIdentity);
        return this.getValidateResponse(result);
    }

    /** NEW STRATEGY, NOT DONE YET */
    protected abstract validateIdentity(
        identity: I,
        id?: number | string,
    ): Promise<ValidationErrorMap>;

    public async validateNestedIdentity(field: string, nestedIdentity: I, rootErrorMap: ValidationErrorMap, id?: number | string): Promise<void> {
        const valErrs = await this.validateIdentity(nestedIdentity, id);
        if (!valErrs.isEmpty()) {
            rootErrorMap.addChild(field, valErrs);
        }
    }

    public abstract resolveIdentity(
        dto: T['__CDto'] | T['__UDto'],
        id: number | string,
    ): Promise<I>;

    /**
     * Entity implementation of buisness logic validation.
     * @param result
     * @param dto
     */
    /*protected abstract doValidateCreateNode(
        dto: T['__CDto'],
        id?: string,
    ): Promise<ValidationErrorMap>;*/

    /**
     * Entity implementation of buisness logic validation
     * @param result
     * @param dto
     */
    /*protected abstract doValidateUpdateNode(
        dto: T['__UDto'],
        id: number,
    ): Promise<ValidationErrorMap>;*/

    /*
        protected doValidateNestedCreateNode(
            dto: T['__NcDto'],
            id: string,
        ): Promise<ValidationErrorMap> {
            throw new Error('nested validation not supported for this entity');
        }
    
        protected doValidateNestedUpdateNode(
            dto: T['__NuDto'],
            id: number,
        ): Promise<ValidationErrorMap> {
            throw new Error('nested validation not supported for this entity');
        }
    */
    /**
     * If the resulting error map is not empty, returns the result as a ValidationErrorResponse, otherwise returns null
     * @param result error map to validate
     */
    protected getValidateResponse(
        result: ValidationErrorMap,
    ): ValidationErrorResponse | null {
        if (result.isEmpty()) {
            return null;
        }
        return result.buildResponse();
    }

    /**
     * root level validation function of DTOs, only called by service.base.create.
     * @param dto root DTO to validate
     * @returns ValidationErrorResponse if validation errors are found, otherwise null
     */
    /*public async validateCreateNode(
        dto: T['__CDto'],
    ): Promise<ValidationErrorResponse | null> {
        const result = await this.doValidateCreateNode(dto);
        return this.getValidateResponse(result);
    }*/

    /**
     * root level validation function of DTOs, only called by service.base.update.
     * @param field
     * @param dto
     * @returns
     */
    /*public async validateUpdateNode(
        dto: T['__UDto'],
        id: number,
    ): Promise<ValidationErrorResponse | null> {
        const result = await this.doValidateUpdateNode(dto, id);

        return this.getValidateResponse(result);
    }*/

    /**
     * Wrapper function to parse nested DTOs. Adds validation errors to the given rootErrorMap under the given field.
     * @param field property corresponding to nested DTO
     * @param dto nested DTO to validate
     * @param rootErrorMap error map that validation errors will be added to under the given field
     */
    /*public async validateNestedNode(
        field: string,
        dto: unknown,
        rootErrorMap: ValidationErrorMap,
    ): Promise<void> {
        if (this.isNestedCreateDto(dto)) {
            const valErrs = await this.doValidateNestedCreateNode(dto, dto.createId);
            if (!valErrs.isEmpty()) {
                rootErrorMap.addChild(field, valErrs);
            }
        } else if (this.isNestedUpdateDto(dto)) {
            const valErrs = await this.doValidateNestedUpdateNode(dto, dto.id);
            if (!valErrs.isEmpty()) {
                rootErrorMap.addChild(field, valErrs);
            }
        } else {
            throw new Error('validateNestedNode received invalid nested DTO');
        }
    }*/

    /**
     * Wrapper function to parse multiple nested DTOs. Adds validation errors to the given rootErrorMap under the given field.
     * @param field property corresponding to nested DTO
     * @param dtos array of nested DTOs to validate
     * @param rootErrorMap error map that validation errors will be added to under the given field
     */
    /* public async validateManyNestedNode(
         field: string,
         dtos: unknown[],
         rootErrorMap: ValidationErrorMap,
     ): Promise<void> {
         for (const dto of dtos) {
             if (this.isNestedCreateDto(dto)) {
                 const valErrs = await this.doValidateNestedCreateNode(
                     dto,
                     dto.createId,
                 );
                 if (!valErrs.isEmpty()) {
                     rootErrorMap.addChild(field, valErrs);
                 }
             } else if (this.isNestedUpdateDto(dto)) {
                 const valErrs = await this.doValidateNestedUpdateNode(dto, dto.id);
                 if (!valErrs.isEmpty()) {
                     rootErrorMap.addChild(field, valErrs);
                 }
             } else {
                 throw new Error('validateNestedNode received invalid nested DTO');
             }
         }
     }*/

    /*private isNestedCreateDto(dto: unknown): dto is NestedCreateDto {
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
    }*/
}
