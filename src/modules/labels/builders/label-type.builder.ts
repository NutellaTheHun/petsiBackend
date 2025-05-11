import { BuilderBase } from "../../../base/builder-base";
import { CreateLabelTypeDto } from "../dto/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/update-label-type.dto";
import { LabelType } from "../entities/label-type.entity";
import { LabelTypeValidator } from "../validators/label-type.validator";

export class LabelTypeBuilder extends BuilderBase<LabelType> {
    constructor(
        validator: LabelTypeValidator,
    ){ super(LabelType, validator); }

    protected async createEntity(dto: CreateLabelTypeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateLabelTypeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    } 
/*
    public async buildCreateDto(dto: CreateLabelTypeDto): Promise<LabelType> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return this.build();
    }

    public async buildUpdateDto(toUpdate: LabelType, dto: UpdateLabelTypeDto): Promise<LabelType> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }*/
}