import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderType } from './entities/order-type.entity';
import { OrderMenuItem } from './entities/order-menu-item.entity';
import { OrderController } from './controllers/order.controller';
import { OrderTypeController } from './controllers/order-type.controller';
import { OrderMenuItemController } from './controllers/order-menu-item.controller';
import { OrderService } from './services/order.service';
import { OrderTypeService } from './services/order-type.service';
import { OrderMenuItemService } from './services/order-menu-item.service';
import { OrderBuilder } from './builders/order.builder';
import { OrderTypeBuilder } from './builders/order-type.builder';
import { OrderMenuItemBuilder } from './builders/order-menu-item.builder';
import { OrderTestingUtil } from './utils/order-testing.util';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { OrderTypeValidator } from './validators/order-type.validator';
import { OrderMenuItemValidator } from './validators/order-menu-item.validator';
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
    LoggerModule,
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
