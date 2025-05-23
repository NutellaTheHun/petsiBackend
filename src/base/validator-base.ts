import { ObjectLiteral, Repository } from "typeorm";
import { ValidationError } from "../util/exceptions/validation-error";
import { ValidationException } from "../util/exceptions/validation-exception";
import { ValidatorHelper } from "../util/validatator-helper.util";


export abstract class ValidatorBase<T extends ObjectLiteral> {

    protected helper = new ValidatorHelper();
    protected errors: ValidationError[] = [];

    constructor(
        private readonly entityRepo: Repository<T>,
    ) { }

    public abstract validateCreate(dto: any): Promise<void>;
    public abstract validateUpdate(id: number, dto: any): Promise<void>;

    protected addError(error: ValidationError) {
        this.errors.push(error);
    }

    protected throwIfErrors(): void {
        if (this.errors.length > 0) {
            throw new ValidationException(this.errors);
        }
    }
}