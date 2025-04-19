import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemCategoryController } from './controllers/menu-item-category.controller';
import { MenuItemSizeController } from './controllers/menu-item-size.controller';
import { MenuItemService } from './services/menu-item.service';
import { MenuItemSizeService } from './services/menu-item-size.service';
import { MenuItemCategory } from './entities/menu-item-category.entity';
import { MenuItemSize } from './entities/menu-item-size.entity';
import { MenuItemCategoryBuilder } from './builders/menu-item-category.builder';
import { MenuItemSizeBuilder } from './builders/menu-item-size.builder';
import { MenuItemBuilder } from './builders/menu-item.builder';
import { MenuItemTestingUtil } from './utils/menu-item-testing.util';
import { MenuItemController } from './controllers/menu-item.controller';
import { MenuItemCategoryService } from './services/menu-item-category.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItemCategory,
      MenuItemSize,
      MenuItem,
    ])
  ],

  controllers: [
    MenuItemCategoryController,
    MenuItemSizeController,
    MenuItemController,
  ],

  providers: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,

    MenuItemCategoryBuilder,
    MenuItemSizeBuilder,
    MenuItemBuilder,

    MenuItemTestingUtil,
  ],

  exports: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,

    MenuItemTestingUtil,
  ]
})
export class MenuItemsModule {}
