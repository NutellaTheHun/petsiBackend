import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateTemplateDto } from "../dto/template/create-template.dto";
import { UpdateTemplateDto } from "../dto/template/update-template.dto";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";

@Injectable()
export class TemplateValidator extends ValidatorBase<Template> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,

        @Inject(forwardRef(() => TemplateMenuItemService))
        private readonly itemService: TemplateMenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateTemplateDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { templateName: dto.templateName }});
        if(exists) { 
            return `Template with name ${dto.templateName} already exists`; 
        }

        if(dto.templateItemDtos){
            // no duplicate menuItems
            const duplicateItems = this.helper.hasDuplicatesByComposite(
                dto.templateItemDtos,
                (item) => `${item.menuItemId}`
            );
            if(duplicateItems){
                return 'template cannot have items with multiple menuItems';
            }
            // no duplicate tablePosIndex
            const duplicatePos = this.helper.hasDuplicatesByComposite(
                dto.templateItemDtos,
                (item) => `${item.tablePosIndex}`
            );
            if(duplicatePos){
                return 'template cannot have items with duplicate tablePosIndex values';
            }
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateTemplateDto): Promise<string | null> {
        if(dto.templateName){
            const exists = await this.repo.findOne({ where: { templateName: dto.templateName }});
            if(exists) { 
                return `Template with name ${dto.templateName} already exists`; 
            }
        }

        if(dto.templateItemDtos){
            // no duplicate menuItems
            const resolvedItemDtos: {itemId: number}[] = [];
            const resolvedTablePosDtos: {pos: number}[] = [];
            for(const d of dto.templateItemDtos){
                if(d.mode === 'create'){
                    resolvedItemDtos.push({itemId: d.menuItemId});
                    resolvedTablePosDtos.push({pos: d.tablePosIndex});
                }
                else if(d.mode === 'update'){
                    const currentItem = await this.itemService.findOne(d.id, ['menuItem'])

                    resolvedItemDtos.push({itemId: d.menuItemId ?? currentItem.menuItem.id});
                    resolvedTablePosDtos.push({pos: d.tablePosIndex ?? currentItem.tablePosIndex});
                }
            }
            const duplicateItems = this.helper.hasDuplicatesByComposite(
                resolvedItemDtos,
                (item) => `${item.itemId}`
            );
            if(duplicateItems){
                return 'template cannot have items with multiple menuItems';
            }
            // no duplicate tablePosIndex
            const duplicatePos = this.helper.hasDuplicatesByComposite(
                resolvedTablePosDtos,
                (item) => `${item.pos}`
            );
            if(duplicatePos){
                return 'template cannot have items with duplicate tablePosIndex values';
            }
        }

        return null;
    }
}