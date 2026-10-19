import { Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import { MenuItemSize } from '../entities/menu-item-size.entity';

@Injectable()
export class MenuItemSizeBuilder extends BuilderBase<MenuItemSize> {
    constructor(requestContextService: RequestContextService) {
        super(MenuItemSize, 'MenuItemSizeBuilder', requestContextService);
    }

    protected createEntity(dto: CreateMenuItemSizeDto): void {
        if (dto.name !== undefined) {
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateMenuItemSizeDto): void {
        if (dto.name !== undefined) {
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}
