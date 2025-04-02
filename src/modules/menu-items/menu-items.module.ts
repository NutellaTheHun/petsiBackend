import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemCategoryController } from './controllers/menu-item-category.controller';
import { MenuItemSizeController } from './controllers/menu-item-size.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { MenuItemService } from './services/menu-item.service';
import { MenuItemCategoryService } from './services/menu-item-category.service';
import { MenuItemSizeService } from './services/menu-item-size.service';
import { MenuItemCategory } from './entities/menu-item-category.entity';
import { MenuItemSize } from './entities/menu-item-size.entity';
import { MenuItemCategoryBuilder } from './builders/menu-item-category.builder';
import { MenuItemSizeBuilder } from './builders/menu-item-size.builder';
import { MenuItemBuilder } from './builders/menu-item.builder';
import { OrderMenuItem } from '../orders/entities/order-menu-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderType } from '../orders/entities/order-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItemCategory,
      MenuItemSize,
      MenuItem,

      OrderMenuItem,
      Order,
      OrderType,
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
  ],

  exports: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
  ]
})
export class MenuItemsModule {}
