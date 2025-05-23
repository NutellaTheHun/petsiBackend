import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { LabelType } from "../entities/label-type.entity";
import { CreateLabelTypeDto } from "../dto/label-type/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/label-type/update-label-type.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";

@Injectable()
export class LabelTypeValidator extends ValidatorBase<LabelType> {
    constructor(
        @InjectRepository(LabelType)
        private readonly repo: Repository<LabelType>,
    ) { super(repo); }

    public async validateCreate(dto: CreateLabelTypeDto): Promise<void> {
        const exists = await this.repo.findOne({ where: { labelTypeName: dto.labelTypeName } });
        if (await this.helper.exists(this.repo, 'labelTypeName', dto.labelTypeName)) {
            this.addError({
                error: 'Label type name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateLabelTypeDto',
                sourceEntity: 'LabelType',
                value: dto.labelTypeName,
            } as ValidationError);
        }
        this.throwIfErrors();
    }

    public async validateUpdate(id: number, dto: UpdateLabelTypeDto): Promise<void> {
        if (dto.labelTypeName) {
            if (await this.helper.exists(this.repo, 'labelTypeName', dto.labelTypeName)) {
                this.addError({
                    error: 'Label type name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateLabelTypeDto',
                    contextId: id,
                    sourceEntity: 'LabelType',
                    value: dto.labelTypeName,
                } as ValidationError);
            }
        }
        this.throwIfErrors();
    }
}