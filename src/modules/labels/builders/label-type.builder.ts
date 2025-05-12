import { BuilderBase } from "../../../base/builder-base";
import { CreateLabelTypeDto } from "../dto/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/update-label-type.dto";
import { LabelType } from "../entities/label-type.entity";
import { LabelTypeValidator } from "../validators/label-type.validator";

export class LabelTypeBuilder extends BuilderBase<LabelType> {
    constructor(
        validator: LabelTypeValidator,
    ){ super(LabelType, validator); }

    protected createEntity(dto: CreateLabelTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateLabelTypeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}