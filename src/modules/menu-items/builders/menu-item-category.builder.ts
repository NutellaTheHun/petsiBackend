import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItem } from '../entities/menu-item.entity';

@Injectable()
export class MenuItemCategoryBuilder extends BuilderBase<MenuItemCategory> {
  constructor(
    @InjectRepository(MenuItem)
    private readonly itemRepo: Repository<MenuItem>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      MenuItemCategory,
      'MenuItemCategoryBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateMenuItemCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  protected updateEntity(dto: UpdateMenuItemCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public menuItemsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.itemRepo.find({ where: { id: In(ids) } }),
      'menuItems',
      ids,
    );
  }
}
