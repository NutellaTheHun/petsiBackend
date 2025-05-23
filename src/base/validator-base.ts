import { ObjectLiteral, Repository } from "typeorm";
import { ValidatorHelper } from "../util/validatator-helper.util";
import { ValidationError } from "../util/exceptions/validationError";


export abstract class ValidatorBase<T extends ObjectLiteral> {

    protected helper = new ValidatorHelper();
    protected errors: ValidationError[] = [];

    constructor(
        private readonly entityRepo: Repository<T>,
    ){ }

    public abstract validateCreate(dto: any): Promise<ValidationError[]>;
    public abstract validateUpdate(id: number, dto: any): Promise<ValidationError[]>;

    protected addError(error: ValidationError){
        this.errors.push(error);
    }
}