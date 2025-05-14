import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { OrderMenuItemBuilder } from './builders/order-menu-item.builder';
import { OrderTypeBuilder } from './builders/order-type.builder';
import { OrderBuilder } from './builders/order.builder';
import { OrderMenuItemController } from './controllers/order-menu-item.controller';
import { OrderTypeController } from './controllers/order-type.controller';
import { OrderController } from './controllers/order.controller';
import { OrderMenuItem } from './entities/order-menu-item.entity';
import { OrderType } from './entities/order-type.entity';
import { Order } from './entities/order.entity';
import { OrderMenuItemService } from './services/order-menu-item.service';
import { OrderTypeService } from './services/order-type.service';
import { OrderService } from './services/order.service';
import { OrderTestingUtil } from './utils/order-testing.util';
import { OrderMenuItemValidator } from './validators/order-menu-item.validator';
import { OrderTypeValidator } from './validators/order-type.validator';
import { OrderValidator } from './validators/order.validator';


@Module({
  imports:[
    TypeOrmModule.forFeature([
      Order,
      OrderType,
      OrderMenuItem,
    ]),
    MenuItemsModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],
  controllers: [
    OrderController,
    OrderTypeController,
    OrderMenuItemController,
  ],
  providers: [
    OrderService,
    OrderTypeService,
    OrderMenuItemService,

    OrderBuilder,
    OrderTypeBuilder,
    OrderMenuItemBuilder,

    OrderValidator,
    OrderTypeValidator,
    OrderMenuItemValidator,

    OrderTestingUtil,
  ],
  exports: [
    OrderService,
    OrderTypeService,
    OrderMenuItemService,
  ]
})
export class OrdersModule {}
