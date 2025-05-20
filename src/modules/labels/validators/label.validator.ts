import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Label } from "../entities/label.entity";
import { CreateLabelDto } from "../dto/label/create-label.dto";
import { UpdateLabelDto } from "../dto/label/update-label.dto";

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
                labelType: { id: dto.labelTypeId}
            }
        });
        if(exists){ return 'menuItem / labelType combination already exists'; }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateLabelDto): Promise<string | null> {
        if(dto.labelTypeId && dto.menuItemId) {
            const exists = await this.repo.findOne({ 
                where: {
                    menuItem: { id: dto.menuItemId },
                    labelType: { id: dto.labelTypeId }
                }
            });
            if(exists){ 
                return 'menuItem / labelType combination already exists';
            }
        }
        else if(dto.labelTypeId){
            const currentLabel = await this.repo.findOne({ where: {id}, relations: ['menuItem'] })
            if(!currentLabel){ throw new Error(); }

            const exists = await this.repo.findOne({ 
                where: {
                    menuItem: { id: currentLabel.menuItem.id },
                    labelType: { id: dto.labelTypeId }
                }
            });
            if(exists){ 
                return 'menuItem / labelType combination already exists';
            }
        }
        else if(dto.menuItemId) {
            const currentLabel = await this.repo.findOne({ where: {id}, relations: ['labelType'] })
            if(!currentLabel){ throw new Error(); }

            // No label type set, validation PASS
            if(!currentLabel.labelType){ 
                return null 
            }

            const exists = await this.repo.findOne({ 
                where: {
                    menuItem: { id: dto.menuItemId },
                    labelType: { id: currentLabel.labelType.id }
                }
            });
            if(exists){ 
                return 'menuItem / labelType combination already exists';
            }
        }

        return null;
    }
}