import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Label } from "../entities/label.entity";
import { CreateLabelDto } from "../dto/create-label.dto";
import { UpdateLabelDto } from "../dto/update-label.dto";

@Injectable()
export class LabelValidator extends ValidatorBase<Label> {
    constructor(
        @InjectRepository(Label)
        private readonly repo: Repository<Label>,
    ){ super(repo); }

    public async validateCreate(dto: CreateLabelDto): Promise<string | null> {
        const exists = await this.repo.findOne({ 
            where: {
                menuItem: { id: dto.menuItemId},
                type: { id: dto.typeId}
            }
        });
        if(exists){ return 'menuItem / labelType combination already exists'; }
        return null;
    }
    public async validateUpdate(dto: UpdateLabelDto): Promise<string | null> {
        return null;
    }
}