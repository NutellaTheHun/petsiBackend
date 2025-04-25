import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { Label } from "../entities/label.entity";
import { CreateLabelDto } from "../dto/create-label.dto";
import { UpdateLabelDto } from "../dto/update-label.dto";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { LabelTypeService } from "../services/label-type.service";

@Injectable()
export class LabelBuilder extends BuilderBase<Label> {
    constructor(
        private readonly itemService: MenuItemService,
        private readonly typeService: LabelTypeService,
    ){ super(Label); }

    public menuItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService),'menuItem', id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService),'menuItem', name);
    }

    public imageUrl(url: string): this {
        return this.setProp('imageUrl', url);
    }

    public labelTypeById(id: number): this {
        return this.setPropById(this.typeService.findOne.bind(this.typeService), 'type', id);
    }

    public labelTypeByName(name: string): this {
        return this.setPropByName(this.typeService.findOneByName.bind(this.typeService), 'type', name);
    }

    public async buildCreateDto(dto: CreateLabelDto): Promise<Label> {
        this.reset();

        if(dto.imageUrl){
            this.imageUrl(dto.imageUrl);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.typeId){
            this.labelTypeById(dto.typeId);
        }
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: Label, dto: UpdateLabelDto): Promise<Label> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.imageUrl){
            this.imageUrl(dto.imageUrl);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.typeId){
            this.labelTypeById(dto.typeId);
        }

        return this.build();
    }
}