import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { MenuItemContainerItem } from '../../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemsModule } from '../../menu-items/menu-items.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { OrderCategoryController } from '../controllers/order-category.controller';
import { OrderContainerItemController } from '../controllers/order-container-item.controller';
import { OrderMenuItemController } from '../controllers/order-menu-item.controller';
import { OrderController } from '../controllers/order.controller';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderContainerItem } from '../entities/order-container-item.entity';
import { OrderMenuItem } from '../entities/order-menu-item.entity';
import { Order } from '../entities/order.entity';
import { RecurringOrderSchedule } from '../entities/recurring-order-schedule.entity';
import { OrdersModule } from '../orders.module';
import { OrderCategoryService } from '../services/order-category.service';
import { OrderContainerItemService } from '../services/order-container-item.service';
import { OrderMenuItemService } from '../services/order-menu-item.service';
import { OrderService } from '../services/order.service';

export async function getOrdersTestingModule(opts?: {
    orderMenuItemServiceClass?: new (...args: any[]) => OrderMenuItemService;
    orderCategoryServiceClass?: new (...args: any[]) => OrderCategoryService;
    orderServiceClass?: new (...args: any[]) => OrderService;
    orderContainerItemServiceClass?: new (
        ...args: any[]
    ) => OrderContainerItemService;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                OrderMenuItem,
                OrderCategory,
                Order,
                OrderContainerItem,
                RecurringOrderSchedule,
                MenuItem,
                MenuItemSize,
                MenuItemContainerItem,
            ]),
            TypeOrmModule.forFeature([
                OrderMenuItem,
                OrderCategory,
                Order,
                OrderContainerItem,
                RecurringOrderSchedule,
                MenuItem,
                MenuItemSize,
                MenuItemContainerItem,
            ]),
            MenuItemsModule,
            OrdersModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        controllers: [
            OrderMenuItemController,
            OrderCategoryController,
            OrderController,
            OrderContainerItemController,
        ],

        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(OrderMenuItemService)
        .useClass(opts?.orderMenuItemServiceClass || OrderMenuItemService)
        .overrideProvider(OrderCategoryService)
        .useClass(opts?.orderCategoryServiceClass || OrderCategoryService)
        .overrideProvider(OrderService)
        .useClass(opts?.orderServiceClass || OrderService)
        .overrideProvider(OrderContainerItemService)
        .useClass(opts?.orderContainerItemServiceClass || OrderContainerItemService)
        .compile();
}
