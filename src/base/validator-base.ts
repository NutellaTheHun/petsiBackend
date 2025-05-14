import { ObjectLiteral, Repository } from "typeorm";

export abstract class ValidatorBase<T extends ObjectLiteral> {
    constructor(
        private readonly entityRepo: Repository<T>,
    ){ }

    public abstract validateCreate(dto: any): Promise<string| null>;
    public abstract validateUpdate(dto: any): Promise<string | null>;
}