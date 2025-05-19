import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { OrderMenuItemBuilder } from './builders/order-menu-item.builder';
import { OrderCategoryBuilder } from './builders/order-category.builder';
import { OrderBuilder } from './builders/order.builder';
import { OrderMenuItemController } from './controllers/order-menu-item.controller';
import { OrderCategoryController } from './controllers/order-category.controller';
import { OrderController } from './controllers/order.controller';
import { OrderMenuItem } from './entities/order-menu-item.entity';
import { OrderCategory } from './entities/order-category.entity';
import { Order } from './entities/order.entity';
import { OrderMenuItemService } from './services/order-menu-item.service';
import { OrderCategoryService } from './services/order-category.service';
import { OrderService } from './services/order.service';
import { OrderTestingUtil } from './utils/order-testing.util';
import { OrderMenuItemValidator } from './validators/order-menu-item.validator';
import { OrderCategoryValidator } from './validators/order-category.validator';
import { OrderValidator } from './validators/order.validator';
import { OrderContainerItem } from './entities/order-container-item.entity';
import { OrderContainerItemController } from './controllers/order-container-item.controller';
import { OrderContainerItemService } from './services/order-container-item.service';
import { OrderContainerItemBuilder } from './builders/order-container-item.builder';
import { OrderContainerItemValidator } from './validators/order-container-item.validator';


@Module({
  imports:[
    TypeOrmModule.forFeature([
      Order,
      OrderCategory,
      OrderMenuItem,
      OrderContainerItem,
    ]),
    MenuItemsModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],
  controllers: [
    OrderController,
    OrderCategoryController,
    OrderMenuItemController,
    OrderContainerItemController
  ],
  providers: [
    OrderService,
    OrderCategoryService,
    OrderMenuItemService,
    OrderContainerItemService,

    OrderBuilder,
    OrderCategoryBuilder,
    OrderMenuItemBuilder,
    OrderContainerItemBuilder,

    OrderValidator,
    OrderCategoryValidator,
    OrderMenuItemValidator,
    OrderContainerItemValidator,

    OrderTestingUtil,
  ],
  exports: [
    OrderService,
    OrderCategoryService,
    OrderMenuItemService,
    OrderContainerItemService,
  ]
})
export class OrdersModule {}
