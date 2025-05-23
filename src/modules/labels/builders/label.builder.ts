import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateLabelDto } from "../dto/label/create-label.dto";
import { UpdateLabelDto } from "../dto/label/update-label.dto";
import { Label } from "../entities/label.entity";
import { LabelTypeService } from "../services/label-type.service";
import { LabelValidator } from "../validators/label.validator";

@Injectable()
export class LabelBuilder extends BuilderBase<Label> {
    constructor(
        private readonly itemService: MenuItemService,
        private readonly typeService: LabelTypeService,
        validator: LabelValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(Label, 'LabelBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateLabelDto): void {
        if (dto.imageUrl !== undefined) {
            this.imageUrl(dto.imageUrl);
        }
        if (dto.menuItemId !== undefined) {
            this.menuItemById(dto.menuItemId);
        }
        if (dto.labelTypeId !== undefined) {
            this.labelTypeById(dto.labelTypeId);
        }
    }

    protected updateEntity(dto: UpdateLabelDto): void {
        if (dto.imageUrl !== undefined) {
            this.imageUrl(dto.imageUrl);
        }
        if (dto.menuItemId !== undefined) {
            this.menuItemById(dto.menuItemId);
        }
        if (dto.labelTypeId !== undefined) {
            this.labelTypeById(dto.labelTypeId);
        }
    }

    public menuItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'menuItem', id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'menuItem', name);
    }

    public imageUrl(url: string): this {
        return this.setPropByVal('imageUrl', url);
    }

    public labelTypeById(id: number): this {
        return this.setPropById(this.typeService.findOne.bind(this.typeService), 'labelType', id);
    }

    public labelTypeByName(name: string): this {
        return this.setPropByName(this.typeService.findOneByName.bind(this.typeService), 'labelType', name);
    }
}