import { ObjectLiteral, Repository } from "typeorm";
import { ValidatorHelper } from "../util/validatator-helper.util";

export abstract class ValidatorBase<T extends ObjectLiteral> {

    protected helper = new ValidatorHelper();
    
    constructor(
        private readonly entityRepo: Repository<T>,
    ){ }

    public abstract validateCreate(dto: any): Promise<string| null>;
    public abstract validateUpdate(id: number, dto: any): Promise<string | null>;
}