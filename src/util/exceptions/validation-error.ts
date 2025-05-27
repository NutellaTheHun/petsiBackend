export class ValidationError {
    /**
     * Short, user friendly error description.
     */
    errorMessage: string;
    /**
     * Type of validation error.
     */
    errorType: 'EXIST' | 'DUPLICATE' | 'INVALID' | 'MISSING';
    /**
     * Id of the entity that caused the error.
     */
    sourceId?: number;
    /**
     * The entity of the error origin.
     */
    sourceEntity: string;
    /**
     * Id of the entity that instigated the error source.
     */
    conflictId?: number;
    /**
     * The entity that instigated the error source.
     */
    conflictEntity: string;
    /**
     * Id of the entity that the error source and conflict reside in.
     * 
     * Such as a Update Dto, or a container item.
     */
    contextId?: number;
    /**
     * Id of the entity that the error source and conflict reside in.
     * 
     * Such as a Update Dto, or a container item.
     */
    contextEntity?: string;
    /**
     * A value of the error source that is relevant when the Id is not sufficient 
     * or available.
     * 
     * For example: If a category name already exists,
     * the name value would be returned as the value.
     */
    value?: any;

    constructor(init?: Partial<ValidationError>) {
        Object.assign(this, init);
    }
}