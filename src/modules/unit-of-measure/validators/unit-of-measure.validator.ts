import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasure> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}