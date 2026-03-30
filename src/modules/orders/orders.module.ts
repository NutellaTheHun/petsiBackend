import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItemContainerItem } from '../menu-items/entities/menu-item-container-item.entity';
import { MenuItemSize } from '../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { RevisionHistoryModule } from '../revision-history/revision-history.module';
import { OrderCategoryBuilder } from './builders/order-category.builder';
import { OrderContainerItemBuilder } from './builders/order-container-item.builder';
import { OrderMenuItemBuilder } from './builders/order-menu-item.builder';
import { OrderBuilder } from './builders/order.builder';
import { RecurringOrderScheduleBuilder } from './builders/recurring-order-schedule.builder';
import { OrderCategoryController } from './controllers/order-category.controller';
import { OrderContainerItemController } from './controllers/order-container-item.controller';
import { OrderMenuItemController } from './controllers/order-menu-item.controller';
import { OrderController } from './controllers/order.controller';
import { OrderCategory } from './entities/order-category.entity';
import { OrderContainerItem } from './entities/order-container-item.entity';
import { OrderMenuItem } from './entities/order-menu-item.entity';
import { Order } from './entities/order.entity';
import { RecurringOrderSchedule } from './entities/recurring-order-schedule.entity';
import { OrderCategoryService } from './services/order-category.service';
import { OrderContainerItemService } from './services/order-container-item.service';
import { OrderMenuItemService } from './services/order-menu-item.service';
import { OrderRecurrenceService } from './services/order-recurrence.service';
import { OrderService } from './services/order.service';
import { RecurringOrderScheduleService } from './services/recurring-order-schedule.service';
import { OrderContainerItemComposer } from './utils/composers/order-container-item.composer';
import { OrderMenuItemComposer } from './utils/composers/order-menu-item.composer';
import { RecurringOrderScheduleComposer } from './utils/composers/recurring-order-schedule.composer';
import { OrderContainerItemChangeDetector } from './utils/change-detectors/order-container-item.change-detector';
import { OrderMenuItemChangeDetector } from './utils/change-detectors/order-menu-item.change-detector';
import { OrderChangeDetector } from './utils/change-detectors/order.change-detector';
import { RecurringOrderScheduleChangeDetector } from './utils/change-detectors/recurring-order-schedule.change-detector';
import { OrderTestingUtil } from './utils/order-testing.util';
import { OrderCategoryValidator } from './validators/order-category.validator';
import { OrderContainerItemValidator } from './validators/order-container-item.validator';
import { OrderMenuItemValidator } from './validators/order-menu-item.validator';
import { OrderValidator } from './validators/order.validator';
import { RecurringOrderScheduleValidator } from './validators/recurring-order-schedule.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderCategory,
            OrderMenuItem,
            OrderContainerItem,
            RecurringOrderSchedule,
            MenuItem,
            MenuItemSize,
            MenuItemContainerItem
        ]),
        MenuItemsModule,
        RevisionHistoryModule,
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [
        OrderController,
        OrderCategoryController,
        OrderMenuItemController,
        OrderContainerItemController,
    ],
    providers: [
        OrderService,
        OrderCategoryService,
        OrderMenuItemService,
        OrderContainerItemService,
        RecurringOrderScheduleService,

        OrderRecurrenceService,

        OrderBuilder,
        OrderCategoryBuilder,
        OrderMenuItemBuilder,
        OrderContainerItemBuilder,
        RecurringOrderScheduleBuilder,

        OrderValidator,
        OrderCategoryValidator,
        OrderMenuItemValidator,
        OrderContainerItemValidator,
        RecurringOrderScheduleValidator,

        OrderMenuItemComposer,
        OrderContainerItemComposer,
        RecurringOrderScheduleComposer,
        OrderContainerItemChangeDetector,
        OrderMenuItemChangeDetector,
        RecurringOrderScheduleChangeDetector,
        OrderChangeDetector,

        OrderTestingUtil,
    ],
    exports: [
        OrderService,
        OrderCategoryService,
        OrderMenuItemService,
        OrderContainerItemService,
        RecurringOrderScheduleService,
        OrderTestingUtil,
    ],
})
export class OrdersModule { }
