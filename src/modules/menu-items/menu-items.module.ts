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
import { MenuItemComponent } from './entities/menu-item-component.entity';
import { MenuItemComponentController } from './controllers/menu-item-component.controller';
import { MenuItemComponentService } from './services/menu-item-component.service';
import { MenuItemComponentBuilder } from './builders/menu-item-component.builder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItemCategory,
      MenuItemSize,
      MenuItem,
      MenuItemComponent,
    ])
  ],

  controllers: [
    MenuItemCategoryController,
    MenuItemSizeController,
    MenuItemController,
    MenuItemComponentController,
  ],

  providers: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemComponentService,

    MenuItemCategoryBuilder,
    MenuItemSizeBuilder,
    MenuItemBuilder,
    MenuItemComponentBuilder,

    MenuItemTestingUtil,
  ],

  exports: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemComponentService,

    MenuItemTestingUtil,
  ]
})
export class MenuItemsModule {}
