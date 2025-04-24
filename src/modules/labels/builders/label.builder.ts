import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { Label } from "../entities/label.entity";
import { CreateLabelDto } from "../dto/create-label.dto";
import { UpdateLabelDto } from "../dto/update-label.dto";
import { MenuItemService } from "../../menu-items/services/menu-item.service";

@Injectable()
export class LabelBuilder extends BuilderBase<Label> {
    constructor(
        private readonly itemService: MenuItemService,
    ){ super(Label); }

    public menuItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService),'menuItem', id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService),'menuItem', name);
    }

    public labelUrls(urls: Record<string, string>): this {
        return this.setProp('labelUrls', urls);
    }

    public async buildCreateDto(dto: CreateLabelDto): Promise<Label> {
        this.reset();

        if(dto.labelUrls){
            this.labelUrls(dto.labelUrls);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: Label, dto: UpdateLabelDto): Promise<Label> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.labelUrls){
            this.labelUrls(dto.labelUrls);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }

        return this.build();
    }
}