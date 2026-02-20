import { ValidationErrorCode } from "./validation-error-codes";

/**
 * Response object to be returned to the client. A translated version of ValidationErrorMap.
 */
export type ValidationErrorResponse = {
    id?: string | number;
    errorPayload?: ValidationErrorPayload[];
    nestedErrors?: Record<string, ValidationErrorResponse[]>;
};

/**
 * Actual error information to be returned to the client. Must contain an error code and fields must be atleast a size of 1.
 */
export type ValidationErrorPayload = { errorCode: ValidationErrorCode, ids?: (string | number)[], fields?: string[] };

export function createValidationErrorPayload(errorCode: ValidationErrorCode, ids?: (string | number)[], fields?: string[]): ValidationErrorPayload {
    if (fields && fields.length === 0) {
        throw new Error("Fields cannot be empty");
    }
    return { errorCode, ids, fields };
}

export class ValidationErrorMap {
    /**
     * Nested ValidationErrorMap objects, key is property, ValidationErrorMap array is resulting validation errors for that property from its validator.
     */
    private children?: Map<string, ValidationErrorMap[]>;
    /**
     * id to identify entity who errs pertains to.
     */
    id?: string | number;
    /**
     * Actual errors resulting from validation, contains error code, ids associated with error, and fields associated with error.
     */
    errors?: ValidationErrorPayload[];

    constructor(id?: string | number, errs?: ValidationErrorPayload[]) {
        this.id = id;
        this.errors = errs;
    }

    public addChild(field: string, child: ValidationErrorMap) {
        if (!this.children) {
            this.children = new Map();
        }
        const list = this.children.get(field) ?? [];
        list.push(child);
        this.children.set(field, list);
    }

    public addChildren(field: string, children: ValidationErrorMap[]) {
        if (!this.children) {
            this.children = new Map();
        }
        const list = this.children.get(field) ?? [];
        list.push(...children);
        this.children.set(field, list);
    }

    public addError(errorCode: ValidationErrorCode, ids?: (string | number)[], fields?: string[]) {
        const newError = createValidationErrorPayload(errorCode, ids, fields);
        if (this.errors) {
            this.errors.push(newError);
        } else {
            this.errors = [newError];
        }
    }

    public isEmpty(): boolean {
        const hasErrs = !!this.errors && this.errors.length > 0;
        const hasChildren = !!this.children && this.children.size > 0;
        return !hasErrs && !hasChildren;
    }

    /**
     * 
     * @returns ValidationErrorResponse object containing id, errs, and errors. A object more suitable for returning to the client.
     */
    public buildResponse(): ValidationErrorResponse {
        const result: ValidationErrorResponse = {};

        if (this.id !== undefined) {
            result.id = this.id;
        }

        if (this.errors) {
            result.errorPayload = this.errors;
        }

        if (this.children && this.children.size > 0) {
            const errors: Record<string, ValidationErrorResponse[]> = {};

            for (const [field, children] of this.children.entries()) {
                errors[field] = children.map((child) => child.buildResponse());
            }

            result.nestedErrors = errors;
        }

        return result;
    }
}


// Helper functions to make testing easier

export type ErrorSelector =
    | { prop: string }
    | { prop: string; id?: string | number };

export function findValidationErrorResponseByPath(
    root: ValidationErrorResponse | null | undefined,
    path: ErrorSelector[],
): ValidationErrorResponse | null {
    if (!root) return null;

    let current: ValidationErrorResponse = root;

    for (const selector of path) {
        let next = current.nestedErrors?.[selector.prop] ?? [];

        if (next.length === 0) return null;

        if ('id' in selector && selector.id !== undefined) {
            next = next.filter((err) => err.id === selector.id);
            if (next.length === 0) return null;
        }

        current = next[0];
    }

    return current;
}

export function findValidationErrors(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
): ValidationErrorPayload[] | null {
    const errResponse = findValidationErrorResponseByPath(root, path);

    return errResponse?.errorPayload ?? null;
}

export function expectValidationErrorPayload(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
    payload: ValidationErrorPayload,
) {
    const errors = findValidationErrors(root, path);
    expect(errors).toContainEqual(payload);
}

export function expectValidationErrorCode(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
    errorCode: ValidationErrorCode,
) {
    const errors = findValidationErrors(root, path);
    expect(errors).toBeTruthy();
    expect(errors!.some(e => e.errorCode === errorCode)).toBe(true);
}

export function expectValidationErrorSize(
    root: ValidationErrorResponse | null,
    size: number,
) {
    const result = getValidationErrorSize(root);
    expect(result).toBe(size);
}

function getValidationErrorSize(root: ValidationErrorResponse | null): number {
    let count = 0;
    if (root?.errorPayload?.length) {
        count += root.errorPayload.length;
    }
    if (root?.nestedErrors) {
        for (const errResponseArray of Object.values(root.nestedErrors)) {
            for (const errResponse of errResponseArray) {
                count += getValidationErrorSize(errResponse);
            }
        }
    }
    return count;
}

/*export function expectValidationErrorSize(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
    size: number,
) {
    const errors = findValidationErrors(root, path);
    expect(errors).toBeTruthy();
    expect(errors!.length).toBe(size);
}

export function expectValidationNestedErrorsSize(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
    size: number,
) {
    const errResponse = findValidationErrorResponseByPath(root, path);
    expect(errResponse?.nestedErrors).toBeTruthy();
    expect(Object.keys(errResponse?.nestedErrors ?? {}).length).toBe(size);
}*/

// Even Lazier functions
/*export function expectOneValidationError(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
) {
    expectValidationErrorSize(root, path, 1);
}

export function expectZeroValidationNestedErrors(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
) {
    expectValidationNestedErrorsSize(root, path, 0);
}

export function expectOneValidationNestedError(
    root: ValidationErrorResponse | null,
    path: ErrorSelector[],
) {
    expectValidationNestedErrorsSize(root, path, 1);
}*/