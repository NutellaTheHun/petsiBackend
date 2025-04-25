import { BuilderBase } from "../../../base/builder-base";
import { CreateLabelTypeDto } from "../dto/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/update-label-type.dto";
import { LabelType } from "../entities/label-type.entity";

export class LabelTypeBuilder extends BuilderBase<LabelType> {
    constructor(){ super(LabelType); }

    public name(name: string): this {
        return this.setProp('name', name);
    } 

    public async buildCreateDto(dto: CreateLabelTypeDto): Promise<LabelType> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return this.build();
    }

    public async buildUpdateDto(toUpdate: LabelType, dto: UpdateLabelTypeDto): Promise<LabelType> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }
}